import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import { capitalize, humanizeDueDate } from '../util.js';
import { EventType } from '../const.js';
import flatpickr from 'flatpickr';
import he from 'he';

import 'flatpickr/dist/flatpickr.min.css';

const dateFormat = {
  FULL_DATE: 'DD/MM/YY H:mm'
};

const createPictures = (destination) => {
  if (!destination) {
    return '';
  }
  if (destination.pictures) {
    return `
      <div class="event__photos-container">
        <div class="event__photos-tape">
        ${destination.pictures.map((picture) => `<img class="event__photo" src="${picture.src}" alt="${picture.description}">`)}
        </div>
      </div>`;
  }
};

const findDestinationDescription = (point, destinations) => {
  if (!destinations.find((destination) => destination.id === point.destination)) {
    return 'Choose your destiny';
  }
  return destinations.find((destination) => destination.id === point.destination).description;
};

const findDestination = (point, destinations) => {
  if (!destinations.find((destination) => destination.id === point.destination)) {
    return '';
  }
  return destinations.find((destination) => destination.id === point.destination);
};

const createFormTemplate = (point, destinations, offers) => {
  const { basePrice, dateFrom, dateTo, type, isDisabled, isSaving } = point;
  const offersByType = offers.find((offer) => offer.type === point.type).offers;
  const pointDestination = findDestination(point, destinations);

  return `<li class="trip-events__item">
    <form class="event event--edit" action="#" method="post">
      <header class="event__header">
        <div class="event__type-wrapper">
          <label class="event__type  event__type-btn" for="event-type-toggle-1">
            <span class="visually-hidden">Choose event type</span>
            <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
          </label>
          <input class="event__type-toggle  visually-hidden" id="event-type-toggle-1" type="checkbox">

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
               ${Object.values(EventType).map((event) => `
                <div class="event__type-item">
                  <input id="event-type-${event}-1" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${event}">
                    <label class="event__type-label  event__type-label--${event}" for="event-type-${event}-1">${capitalize(event)}</label>
                </div>`).join('')}
              </fieldset>
            </div>
        </div>

        <div class="event__field-group  event__field-group--destination">
          <label class="event__label  event__type-output" for="event-destination-1">
            ${capitalize(type)}
          </label>
          <input class="event__input  event__input--destination" id="event-destination-1" type="text" name="event-destination" list="destination-list-1" value="${pointDestination ? pointDestination.name : pointDestination}" required>
            <datalist id="destination-list-1">
              ${destinations.map((dest) => `<option value="${dest.name}"></option>`).join('')}
            </datalist>
        </div>

        <div class="event__field-group  event__field-group--time">
          <label class="visually-hidden" for="event-start-time-1">From</label>
          <input class="event__input  event__input--time" id="event-start-time-1" type="text" name="event-start-time" value="${humanizeDueDate(dateFrom, dateFormat.FULL_DATE)}" required>
            &mdash;
            <label class="visually-hidden" for="event-end-time-1">To</label>
            <input class="event__input  event__input--time" id="event-end-time-1" type="text" name="event-end-time" value="${humanizeDueDate(dateTo, dateFormat.FULL_DATE)}" required>
            </div>

            <div class="event__field-group  event__field-group--price">
              <label class="event__label" for="event-price-1">
                <span class="visually-hidden">Price</span>
                &euro;
              </label>
              <input class="event__input  event__input--price" id="event-price-1" type="text" name="event-price" value="${he.encode(basePrice.toString())}">
            </div>

            <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${isSaving ? 'Saving...' : 'Save'}</button>
            <button class="event__reset-btn" type="reset">Cancel</button>
          </header>
          <section class="event__details">
            <section class="event__section  event__section--offers">
            ${offersByType.length ? '<h3 class="event__section-title  event__section-title--offers">Offers</h3>' : ''}
              <div class="event__available-offers">
                ${offersByType.map((offer) => `
                <div class="event__offer-selector">
                  <input class="event__offer-checkbox  visually-hidden" id="${offer.title}" data-id="${offer.id}" type="checkbox" name="event-offer-luggage" ${point.offers.includes(offer.id) ? 'checked' : ''}>
                    <label class="event__offer-label" for="${offer.title}">
                      <span class="event__offer-title">${offer.title}</span>
                      &plus;&euro;&nbsp;
                      <span class="event__offer-price">${offer.price}</span>
                    </label>
                </div>`).join('')}
              </div>
            </section>

            <section class="event__section  event__section--destination">
              <h3 class="event__section-title  event__section-title--destination">Destination</h3>
              <p class="event__destination-description">${findDestinationDescription(point, destinations)}</p>
              ${createPictures(pointDestination)}
            </section>
          </section>
        </form>
      </li>`;
};

export default class CreateFormView extends AbstractStatefulView {
  #handleFormSubmit;
  #datepickerFrom;
  #datepickerTo;
  #newEventBtn;
  #handleNewEventClick;
  #handleDeleteClick;
  #offers = null;
  #form = null;

  constructor(points, destinations, offers, {onFormSubmit, onDeleteClick, onNewEventClick}) {
    super();
    this.points = points;
    this._setState(CreateFormView.parsePointToState(points));
    this.destinations = destinations;
    this.#offers = offers;
    this.#handleFormSubmit = onFormSubmit;
    this.#newEventBtn = document.querySelector('.trip-main__event-add-btn');
    this.#handleNewEventClick = onNewEventClick;
    this.#handleDeleteClick = onDeleteClick;
    this._restoreHandlers();
  }

  get template () {
    return createFormTemplate(this._state, this.destinations, this.#offers);
  }

  _restoreHandlers() {
    this.element.querySelector('form')
      .addEventListener('submit', this.#formSubmitHandler);
    this.element.querySelector('.event__type-group')
      .addEventListener('change', this.#eventTypeHandler);
    this.element.querySelector('.event__input--destination')
      .addEventListener('change', this.#destinationChangeHandler);
    this.element.querySelector('.event__reset-btn').
      addEventListener('click', this.#deletePointHandler);
    this.#newEventBtn.addEventListener('click', this.#newEventHandler);
    this.element.querySelector('.event__input--price').
      addEventListener('change', this.#basePriceChangeHandler);

    this.#setDatepicker();
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#offersSaveHandler();
    this.#handleFormSubmit(CreateFormView.parseStateToPoint(this._state));
    this.#newEventBtn.disabled = false;
  };

  #newEventHandler = (evt) => {
    evt.preventDefault();
    this.#handleNewEventClick();
    this.#newEventBtn.disabled = true;
  };

  #dateFromChangeHandler = ([userDate]) => {
    this.updateElement({
      dateFrom: userDate
    });
  };

  #dateToChangeHandler = ([userDate]) => {
    this.updateElement({
      dateTo: userDate
    });
  };

  #setDatepicker() {
    this.#datepickerFrom = flatpickr(
      this.element.querySelector('.event__input--time[name=event-start-time]'),
      {
        dateFormat: 'd/m/y H:m',
        enableTime: true,
        /* eslint-disable */
        time_24hr: true,
        /* eslint-enable */
        defaultDate: this._state.dateFrom,
        minDate: new Date(),
        maxDate: this._state.dateTo,
        onChange: this.#dateFromChangeHandler,

      }
    );

    this.#datepickerTo = flatpickr(
      this.element.querySelector('.event__input--time[name=event-end-time]'),
      {
        dateFormat: 'd/m/y H:m',
        enableTime: true,
        /* eslint-disable */
        time_24hr: true,
        /* eslint-enable */
        defaultDate: this._state.dateTo,
        minDate: this._state.dateFrom,
        onChange: this.#dateToChangeHandler
      }
    );
  }

  static parsePointToState(point) {
    return {...point,
      isDisabled: false,
      isSaving: false,
    };
  }

  static parseStateToPoint(state) {
    const point = {...state};

    delete point.isDisabled;
    delete point.isSaving;

    return point;
  }

  #eventTypeHandler = () => {
    this.updateElement({
      type: this.element.querySelector('input[type=radio]:checked').value
    });
  };

  #destinationChangeHandler = (evt) => {
    try {
      this.updateElement({
        destination: this.destinations.find((destination) => destination.name === evt.target.value).id
      });
    } catch (err) {
      if (err instanceof TypeError) {
        evt.target.focus();
      }
    }
  };

  #basePriceChangeHandler = () => {
    this.updateElement({
      basePrice: this.element.querySelector('.event__input--price').value
    });
  };

  #offersSaveHandler = () => {
    const offerIds = Array.from(this.element.querySelectorAll('.event__offer-checkbox:checked')).map((el) => el.dataset.id);
    this.updateElement({
      offers: [...offerIds]
    });
  };

  removeElement() {
    super.removeElement();

    if(this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }

    if(this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }

  reset(point) {
    this.updateElement(
      CreateFormView.parsePointToState(point)
    );
  }

  #deletePointHandler = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(CreateFormView.parseStateToPoint(this._state));
    this.#newEventBtn.disabled = false;
  };
}
