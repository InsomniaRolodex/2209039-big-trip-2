import dayjs from 'dayjs';
import lodash from 'lodash';
import { FilterType } from './const.js';

const MINUTES_IN_HOUR = 60;

const humanizeDueDate = (dueDate, dateFormat) => dueDate ? dayjs(dueDate).format(dateFormat) : '';

const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

const findSortingDuration = (point) => dayjs(point.dateTo).diff(dayjs(point.dateFrom), 'm');

const findDuration = (point) => {
  let minutesDuration = findSortingDuration(point);
  const minutesAfterHours = minutesDuration % MINUTES_IN_HOUR;

  if (minutesDuration >= MINUTES_IN_HOUR && minutesAfterHours !== 0) {
    minutesDuration /= MINUTES_IN_HOUR;

    return `${Math.floor(minutesDuration)}H ${minutesAfterHours}M`;
  }

  if (minutesDuration >= MINUTES_IN_HOUR) {
    minutesDuration /= MINUTES_IN_HOUR;
  }

  return `${Math.floor(minutesDuration)}H`;
};

const checkPastPoints = (points) => {
  const dates = points.map((point) => point.dateTo);
  if (dates.every((date) => dayjs(date).diff(dayjs() < 0))) {
    return 'disabled';
  }
};

const checkFuturePoints = (points) => {
  const dates = points.map((point) => point.dateFrom);
  if (dates.every((date) => dayjs(date) < dayjs())) {
    return 'disabled';
  }
};

const checkPresentPoints = (points) => {
  if (!(points.every((point) => (dayjs(point.dateFrom).isBefore(dayjs()) &&
  dayjs(point.dateTo).isAfter(dayjs()))))) {
    return 'disabled';
  }
};

const toCamelCase = (str) => lodash.camelCase(str);

const updateItem = (items, update) => items.map((item) => item.id === update.id ? update : item);

const getWeightForDate = (dateA, dateB) => {
  if (dateA === null && dateB === 0) {
    return 0;
  }

  if (dateA === null) {
    return 1;
  }

  if (dateB === null) {
    return -1;
  }

  return null;
};

const sortPointsByDay = (pointA, pointB) => {
  const weight = getWeightForDate(pointA.dateFrom, pointB.dateFrom);

  return weight ?? dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
};

const isDateEqual = (dateA, dateB) => (dateA === null && dateB === null) || dayjs(dateA).isSame(dateB, 'D');

const filter = {
  [FilterType.EVERYTHING]: (points) => points,
  [FilterType.FUTURE]: (points) => points.filter((point) => dayjs(point.dateFrom) > (dayjs())),
  [FilterType.PAST]: (points) => points.filter((point) => dayjs(point.dateTo) < dayjs()),
  [FilterType.PRESENT]: (points) => points.filter((point) => dayjs(point.dateFrom) < dayjs() && dayjs(point.dateTo) > dayjs())
};

export { humanizeDueDate, capitalize, findDuration, toCamelCase, checkPastPoints, checkPresentPoints, checkFuturePoints,
  updateItem, sortPointsByDay, findSortingDuration, isDateEqual, filter };
