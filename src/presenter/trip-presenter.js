import { render, remove } from '../framework/render.js';
// import CreateFormView from '../view/create-form-view.js';
import SortingView from '../view/sorting-view.js';
import TripListView from '../view/trip-list-view.js';
import ListEmptyView from '../view/list-empty-view.js';
import PointModel from '../model/point-model.js';
import PointPresenter from './point-presenter.js';
import { sortPointsByDay, findSortingDuration, filter } from '../util.js';
import { SortingType, UpdateType, UserAction } from '../const.js';


export default class TripPresenter {
  #tripList = new TripListView();
  #container;
  #pointModel;
  #pointPresenters = new Map();
  #points;
  #destinations;
  #offers;
  #sortingComponent;
  #currentSortingType = SortingType.PRICE;
  #sourcedPointsOrder = [];
  #filterModel;
  #filterType;
  #noPointsComponent;

  constructor ({ container, pointModel = new PointModel, filterModel }) {
    this.#container = container;
    this.#pointModel = pointModel;
    this.#filterModel = filterModel;
    this.#pointModel.addObserver(this.#handleModelEvent);
  }

  get points () {
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointModel.points;
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
    this.#pointModel.init();
    // this.#points = this.#pointModel.points;
    this.#destinations = this.#pointModel.destinations;
    this.#offers = this.#pointModel.offers;

    this.#renderList();
    // this.#sourcedPointsOrder = this.#pointModel.points;
    // const defaultPoint = this.#pointModel.defaultPoint;


    // render(new CreateFormView(defaultPoint[0], destinations, offers), this.#tripList.element);
    // this.points.forEach((point) => this.#renderPoint(point, this.#destinations, this.#offers));

  }

  #handleModeChange = () => {
    this.#pointPresenters.forEach((presenter) => presenter.resetPointView());
  };

  #handlePointChange = (updatedPoint) => {
    this.#pointPresenters.get(updatedPoint.id).init(updatedPoint);
  };

  // #handleFavDataChange = (updatedPoint, destination = this.#destinations, offer = this.#offers) => {
  //   this.points = updateItem(this.points, updatedPoint.points);
  //   this.#sourcedPointsOrder = updateItem(this.#sourcedPointsOrder, updatedPoint.points);
  //   this.#pointPresenters.get(updatedPoint.points.id).init(updatedPoint.points, destination, offer);
  // };

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

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointModel.updatePoint(updateType, update);
        break;
      case UserAction.ADD_POINT:
        this.#pointModel.addPoint(updateType, update);
        break;
      case UserAction.DELETE_POINT:
        this.#pointModel.deleteTask(updateType, update);
        break;
    }
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
    }
  };

  #handleSortingTypeChange(sortingType) {
    if (this.#currentSortingType === sortingType) {
      return;
    }
    this.#sortPoints(sortingType);
    this.#clearList();
    this.#renderList();

    // this.points.forEach((point) => this.#renderPoint(point, this.#destinations, this.#offers));
  }

  #renderSorting() {
    this.#sortingComponent = new SortingView({
      currentSoringType: this.#currentSortingType,
      onSortTypeChange: (sortingType) => this.#handleSortingTypeChange(sortingType),
    });

    render(this.#sortingComponent, this.#container);
  }

  #renderPoint(point, destination, offer) {

    const pointPresenter = new PointPresenter({
      tripList: this.#tripList,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange });

    pointPresenter.init(point, destination, offer);
    this.#pointPresenters.set(point.id, pointPresenter);
  }

  #renderNoPointsComponent () {
    this.#noPointsComponent = new ListEmptyView({
      filterType: this.#filterType
    });
  }

  #renderList() {
    const points = this.points;
    this.#renderSorting();

    render(this.#tripList, this.#container);
    if (this.points.length === 0) {
      render(new ListEmptyView, this.#container);
    }

    points.forEach((point) => this.#renderPoint(point, this.#destinations, this.#offers));
  }

  #clearPointList() {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();
  }

  #clearList({ resetSortingType = false }) {
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    remove(this.#sortingComponent);

    if (this.#noPointsComponent) {
      remove(this.#noPointsComponent);
    }

    if (resetSortingType) {
      this.#currentSortingType = SortingType.DAY;
    }
  }
}
