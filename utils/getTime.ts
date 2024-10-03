import { parse } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { enUS } from 'date-fns/locale/en-US';
import { TIMEZONE } from '../constants/configs';

const getTime = (date: string) => {
  const parseDate = parse(date, 'yyyy-MM-dd HH:mm:ss', new Date());
  return {
    text: format(parseDate, 'MMM dd, yyyy hh:mm:ss a', { timeZone: TIMEZONE, locale: enUS }),
    date: toZonedTime(parseDate, TIMEZONE, { timeZone: TIMEZONE }),
  };
};

export default getTime;
