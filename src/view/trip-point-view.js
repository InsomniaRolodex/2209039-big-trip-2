import { createElement } from '../render.js';
import { capitalize, humanizeDueDate, findDuration } from '../util.js';

const dateFormat = {
  MMMD: 'MMM D',
  Hmm: 'H:mm',
  duration: 'duration'
};

const createTripPointTemplate = (point, destionations, offers) => {
  const { basePrice, isFavorite, dateFrom, dateTo, type } = point;
  const offersByType = offers.find((offer) => offer.type === point.type).offers;
  const offersForPoint = offersByType.filter((offerByType) => point.offers.includes(offerByType.id));
  const pointDestination = destionations.find((destination) => destination.id === point.destination).name;

  return `<li class="trip-events__item">
    <div class="event">
      <time class="event__date" datetime="${dateFrom}">${humanizeDueDate(dateFrom, dateFormat.MMMD)}</time>
      <div class="event__type">
        <img class="event__type-icon" width="42" height="42" src="img/icons/${type}.png" alt="Event type icon">
      </div>
      <h3 class="event__title">${capitalize(point.type)} ${pointDestination}</h3>
      <div class="event__schedule">
        <p class="event__time">
          <time class="event__start-time" datetime="${dateFrom}">${humanizeDueDate(dateFrom, dateFormat.Hmm)}</time>
          &mdash;
          <time class="event__end-time" datetime="${dateTo}">${humanizeDueDate(dateTo, dateFormat.Hmm)}</time>
        </p>
        <p class="event__duration">${findDuration(dateTo, dateFrom)}</p>
      </div>
      <p class="event__price">
        &euro;&nbsp;<span class="event__price-value">${basePrice}</span>
      </p>
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
      </button>
      <button class="event__rollup-btn" type="button">
        <span class="visually-hidden">Open event</span>
      </button>
    </div>
  </li>`;
};

export default class TripPoint {
  constructor(points, destionations, offers) {
    this.points = points;
    this.destionations = destionations;
    this.offers = offers;
  }

  getTemplate() {
    return createTripPointTemplate(this.points, this.destionations, this.offers);
  }

  getElement() {
    if (!this.element) {
      this.element = createElement(this.getTemplate());

      return this.element;
    }
  }

  removeElement() {
    this.element = null;
  }
}