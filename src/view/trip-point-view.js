import AbstractView from '../framework/view/abstract-view.js';
import { capitalize, humanizeDueDate, findDuration } from '../util.js';

const dateFormat = {
  MMMD: 'MMM D',
  HMM: 'H:mm',
  DURATION: 'duration'
};

const createEventDateTemplate = (point) => {
  const { dateFrom } = point;

  return `<time class="event__date" datetime="${dateFrom}">${humanizeDueDate(dateFrom, dateFormat.MMMD)}</time>`;
};

const createEventTypeTemplate = (point, destinations) => {

  const { type } = point;
  const pointDestination = destinations.find((destination) => destination.id === point.destination).name;

  return `
    <div class="event__type">
      <img class="event__type-icon" width="42" height="42" src="img/icons/${type}.png" alt="Event type icon">
    </div>
    <h3 class="event__title">${capitalize(point.type)} ${pointDestination}</h3>`;
};

const createScheduleTemplate = (point) => {
  const { basePrice, dateFrom, dateTo } = point;
  return `
    <div class="event__schedule">
    <p class="event__time">
      <time class="event__start-time" datetime="${dateFrom}">${humanizeDueDate(dateFrom, dateFormat.HMM)}</time>
      &mdash;
      <time class="event__end-time" datetime="${dateTo}">${humanizeDueDate(dateTo, dateFormat.HMM)}</time>
    </p>
    <p class="event__duration">${findDuration(point)}</p>
    </div>
    <p class="event__price">
      &euro;&nbsp;<span class="event__price-value">${basePrice}</span>
    </p>`;
};

const createEventPriceTemplate = (point, offers) => {
  const { isFavorite } = point;
  const offersByType = offers.find((offer) => offer.type === point.type).offers;
  const offersForPoint = offersByType.filter((offerByType) => point.offers.includes(offerByType.id));
  return `
  <h4 class="visually-hidden">Offers:</h4>
  <ul class="event__selected-offers">
  ${offersForPoint.map((offer) => `
    <li class="event__offer">
      <span class="event__offer-title">${offer.title}</span>
      &plus;&euro;&nbsp;
      <span class="event__offer-price">${offer.price}</span>
    </li>`).join('')}
  </ul>
  <button class="event__favorite-btn ${isFavorite ? 'event__favorite-btn--active' : ''}" type="button">
    <span class="visually-hidden">Add to favorite</span>
    <svg class="event__favorite-icon" width="28" height="28" viewBox="0 0 28 28">
      <path d="M14 21l-8.22899 4.3262 1.57159-9.1631L.685209 9.67376 9.8855 8.33688 14 0l4.1145 8.33688 9.2003 1.33688-6.6574 6.48934 1.5716 9.1631L14 21z" />
    </svg>
  </button>`;
};

const createEditFormBtnTemplate = () => `
  <button class="event__rollup-btn" type="button">
    <span class="visually-hidden">Open event</span>
  </button>`;

const createTripPointTemplate = (point, destinations, offers) =>
  `<li class="trip-events__item">
    <div class="event">
    ${createEventDateTemplate(point)}
    ${createEventTypeTemplate(point, destinations)}
    ${createScheduleTemplate(point)}
    ${createEventPriceTemplate(point, offers)}
    ${createEditFormBtnTemplate()}
    </div>
  </li>`;
export default class TripPointView extends AbstractView {
  #onEditClick;
  #handleFavoriteClick;
  #favoriteButton;

  constructor(points, destinations, offers, {onEditClick, onFavoriteClick}) {
    super();
    this.points = points;
    this.destinations = destinations;
    this.offers = offers;
    this.#onEditClick = onEditClick;
    this.#handleFavoriteClick = onFavoriteClick;
    this.#favoriteButton = this.element.querySelector('.event__favorite-btn');
    this.element.querySelector('.event__rollup-btn')
      .addEventListener('click', this.#clickHandler);
    this.#favoriteButton.addEventListener('click', this.#favoriteClickHandler);
  }

  get template() {
    return createTripPointTemplate(this.points, this.destinations, this.offers);
  }

  #clickHandler = (evt) => {
    evt.preventDefault();
    this.#onEditClick();
  };

  #favoriteClickHandler = (evt) => {
    evt.preventDefault();
    this.#favoriteButton.disabled = true;
    this.#handleFavoriteClick();
  };
}
