import { parse } from 'date-fns';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import enUS from 'date-fns/locale/en-US';
import { TIMEZONE } from '../constants/configs';

const getTime = (date: string) => {
  return {
    text: formatInTimeZone(
      parse(date, 'yyyy-MM-dd HH:mm:ss', new Date()),
      TIMEZONE,
      'MMM dd, yyyy hh:mm:ss a',
      {
        locale: enUS,
      }
    ),
    date: zonedTimeToUtc(parse(date, 'yyyy-MM-dd HH:mm:ss', new Date()), TIMEZONE),
  };
};

export default getTime;
