import { localization } from '../../core/i18n/runtime';
export const projectUrl = 'https://github.com/wasiliy-strecker/series-log';
export const privacyUrl = () =>
  localization().language === 'de'
    ? 'https://wasiliy-strecker.github.io/series-log/datenschutz/'
    : 'https://wasiliy-strecker.github.io/series-log/privacy/';
