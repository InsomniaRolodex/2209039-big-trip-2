import { SortingType } from '../const.js';
import AbstractView from '../framework/view/abstract-view.js';
import { capitalize } from '../util.js';

const createSortingElement = (sortingType, currentSortingType) => `
  <div class="trip-sort__item  trip-sort__item--${sortingType}">
    <input id="sort-${sortingType}" class="trip-sort__input  visually-hidden" type="radio" name="trip-sort" value="sort-${sortingType}"
      data-sort-type="${sortingType}"
    ${sortingType === 'event' ? 'disabled' : ''}
    ${sortingType === 'offers' ? 'disabled' : ''}
    ${sortingType === currentSortingType ? 'checked' : ''}>
    <label class="trip-sort__btn" for="sort-${sortingType}">${capitalize(sortingType)}</label>
  </div>`;

const createSortingTemplate = (currentSortingType) => `
  <form class="trip-events__trip-sort  trip-sort" action="#" method="get">
    ${Object.values(SortingType).map((sortingType) => createSortingElement(sortingType, currentSortingType)).join('')}
  </form>`;

export default class SortingView extends AbstractView {
  #currentSortingType = null;
  #handleSortTypeChange;

  constructor ({currentSortingType, onSortTypeChange}) {
    super();
    this.#currentSortingType = currentSortingType;
    this.#handleSortTypeChange = onSortTypeChange;
    this.element.addEventListener('change', this.#sortTypeChangeHandler);
  }

  get template () {
    return createSortingTemplate(this.#currentSortingType);
  }

  #checkChosenAttribute(currentElement) {
    currentElement.setAttribute('checked', '');
  }

  #sortTypeChangeHandler = (evt) => {
    this.#handleSortTypeChange(evt.target.dataset.sortType);
  };
}
