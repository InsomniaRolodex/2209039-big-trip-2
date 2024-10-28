import { render, remove, RenderPosition } from '../framework/render.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import LoadingListView from '../view/loading-list-view.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import SortingView from '../view/sorting-view.js';
import TripListView from '../view/trip-list-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import { sortPointsByDay, findSortingDuration, filter } from '../util.js';
import { FilterType, SortingType, UpdateType, UserAction } from '../const.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 100
};

export default class TripPresenter {
  #tripList = new TripListView();
  #loadingComponent = new LoadingListView();
  #container;
  #pointsModel;
  #pointPresenters = new Map();
  #points;
  #destinations;
  #offers;
  #sortingComponent = null;
  #currentSortingType = SortingType.DAY;
  #sourcedPointsOrder = [];
  #filterModel;
  #filterType;
  #noPointsComponent;
  #newPointPresenter = null;

  #isLoading = true;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

  constructor ({ container, pointsModel, filterModel }) {
    this.#container = container;
    this.#pointsModel = pointsModel;
    this.#filterModel = filterModel;
    this.#newPointPresenter = new NewPointPresenter({
      tripList: this.#tripList,
      onDataChange: this.#handleViewAction,
    });
    this.#filterModel.addObserver(this.#handleModelEvent);
    this.#pointsModel.addObserver(this.#handleModelEvent);
  }

  get points () {
    this.#destinations = this.#pointsModel.destinations;
    this.#offers = this.#pointsModel.offers;
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredPoints = filter[this.#filterType](points);

    switch (this.#currentSortingType) {
      case SortingType.DAY:
        return filteredPoints.sort(sortPointsByDay);
      case SortingType.PRICE:
        return filteredPoints.sort((pointA, pointB) => pointA.basePrice - pointB.basePrice);
      case SortingType.TIME:
        return filteredPoints.sort((pointA, pointB) => findSortingDuration(pointA) - findSortingDuration(pointB));
    }

    return filteredPoints;
  }

  init () {
    this.#renderList();
  }

  createPoint() {
    this.#currentSortingType = SortingType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#newPointPresenter.init(this.#pointsModel.defaultPoint, this.#destinations, this.#offers);
  }

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetPointView());
  };

  #handlePointChange = (updatedPoint) => {
    this.#pointPresenters.get(updatedPoint.id).init(updatedPoint);
  };

  #sortPoints(sortingType) {
    switch (sortingType) {
      case SortingType.DAY:
        this.points.sort(sortPointsByDay);
        break;
      case SortingType.PRICE:
        this.points.sort((pointA, pointB) => pointA.basePrice - pointB.basePrice);
        break;
      case SortingType.TIME:

        this.points.sort((pointA, pointB) => findSortingDuration(pointA) - findSortingDuration(pointB));
        break;
      default:
        this.points = [...this.#sourcedPointsOrder];
    }
    this.#currentSortingType = sortingType;
  }

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointPresenters.get(update.id).setSaving();
        try {
          await this.#pointsModel.updatePoint(updateType, update);
        } catch (err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        this.#uiBlocker.unblock();
        break;
      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        try {
          await this.#pointsModel.addPoint(updateType, update);
        } catch(err) {
          this.#newPointPresenter.setAborting();
        }
        this.#uiBlocker.unblock();
        break;
      case UserAction.DELETE_POINT:
        this.#pointPresenters.get(update.id).setDeleting();
        try {
          await this.#pointsModel.deletePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        this.#uiBlocker.unblock();
        break;
    }

    this.#uiBlocker.unblock();
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id).init(data, this.#destinations, this.#offers);
        break;
      case UpdateType.MINOR:
        this.#clearList();
        this.#renderList();
        break;
      case UpdateType.MAJOR:
        this.#clearList({ resetSortingType: true });
        this.#renderList();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderList();
        break;
    }
  };

  #handleSortingTypeChange(sortingType) {
    if (this.#currentSortingType === sortingType) {
      return;
    }
    this.#sortPoints(sortingType);
    this.#clearList();
    this.#renderList();
  }

  #renderSorting() {
    this.#sortingComponent = new SortingView({
      currentSortingType: this.#currentSortingType,
      onSortTypeChange: (sortingType) => this.#handleSortingTypeChange(sortingType),
    });

    render(this.#sortingComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  #renderPoint(point, destination, offer) {

    const pointPresenter = new PointPresenter({
      tripList: this.#tripList,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange });

    pointPresenter.init(point, destination, offer);
    this.#pointPresenters.set(point.id, pointPresenter);
    remove(this.#noPointsComponent);
  }

  #renderLoading() {
    render(this.#loadingComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  #renderNoPointsComponent (points) {
    if (this.#noPointsComponent) {
      remove(this.#noPointsComponent);
    }

    this.#noPointsComponent = new ListEmptyView({
      filterType: this.#filterType
    });
    if (!points.length) {
      render(this.#noPointsComponent, this.#container);
    }
  }

  #renderList() {
    const points = this.points;

    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    this.#renderSorting();
    render(this.#tripList, this.#container);
    this.#renderNoPointsComponent(points);
    points.forEach((point) => this.#renderPoint(point, this.#destinations, this.#offers));
  }

  #clearPointList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #clearList({ resetSortingType = false } = {}) {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    remove(this.#noPointsComponent);
    remove(this.#sortingComponent);
    remove(this.#loadingComponent);

    if (resetSortingType) {
      this.#currentSortingType = SortingType.DAY;
    }
  }
}
