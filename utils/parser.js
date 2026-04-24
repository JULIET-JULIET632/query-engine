const countryMap = {
  nigeria: 'NG',
  kenya: 'KE',
  angola: 'AO',
  ghana: 'GH',
  benin: 'BJ',
  togo: 'TG',
  senegal: 'SN',
  cameroon: 'CM',
  ethiopia: 'ET',
  tanzania: 'TZ',
  uganda: 'UG',
  rwanda: 'RW',
  mali: 'ML',
  niger: 'NE',
  chad: 'TD',
  sudan: 'SD',
  egypt: 'EG',
  morocco: 'MA',
  algeria: 'DZ',
  tunisia: 'TN',
  libya: 'LY',
  somalia: 'SO',
  mozambique: 'MZ',
  zambia: 'ZM',
  zimbabwe: 'ZW',
  botswana: 'BW',
  namibia: 'NA',
  madagascar: 'MG',
  malawi: 'MW',
  congo: 'CG',
  drc: 'CD',
  ivory: 'CI',
  liberia: 'LR',
  guinea: 'GN',
  gambia: 'GM',
  mauritania: 'MR',
  eritrea: 'ER',
  burundi: 'BI',
  gabon: 'GA',
  lesotho: 'LS',
  france: 'FR',
  germany: 'DE',
  spain: 'ES',
  italy: 'IT',
  portugal: 'PT',
  uk: 'GB',
  britain: 'GB',
  england: 'GB',
  usa: 'US',
  america: 'US',
  canada: 'CA',
  brazil: 'BR',
  india: 'IN',
  china: 'CN',
  japan: 'JP',
  australia: 'AU',
  sweden: 'SE',
  norway: 'NO',
  denmark: 'DK',
  finland: 'FI',
  poland: 'PL',
  ukraine: 'UA',
  romania: 'RO',
  hungary: 'HU',
  turkey: 'TR',
  iran: 'IR',
  iraq: 'IQ',
  pakistan: 'PK',
  bangladesh: 'BD',
  indonesia: 'ID',
  philippines: 'PH',
  vietnam: 'VN',
  thailand: 'TH',
  myanmar: 'MM',
  malaysia: 'MY',
  singapore: 'SG',
  mexico: 'MX',
  argentina: 'AR',
  colombia: 'CO',
  peru: 'PE',
  venezuela: 'VE',
  chile: 'CL',
  ecuador: 'EC',
  bolivia: 'BO',
  paraguay: 'PY',
  uruguay: 'UY',
};

function parseQuery(q) {
  if (!q || q.trim() === '') return null;

  const query = q.toLowerCase().trim();
  const filters = {};

  // ─── GENDER ───
  const hasFemale = /\b(female|females|women|woman|girl|girls)\b/.test(query);
  const hasMale = /\b(male|males|men|man|boy|boys)\b/.test(query);
  const hasBoth = /\b(male and female|female and male|both genders|all genders)\b/.test(query);

  if (hasBoth) {
    // no gender filter
  } else if (hasFemale && !hasMale) {
    filters.gender = 'female';
  } else if (hasMale && !hasFemale) {
    filters.gender = 'male';
  }

  // ─── AGE GROUP ───
  if (/\byoung\b/.test(query)) {
    filters.min_age = 16;
    filters.max_age = 24;
  } else if (/\b(senior|seniors|elderly|old people|older people)\b/.test(query)) {
    filters.age_group = 'senior';
  } else if (/\b(adult|adults)\b/.test(query)) {
    filters.age_group = 'adult';
  } else if (/\b(teenager|teenagers|teen|teens|adolescent|adolescents)\b/.test(query)) {
    filters.age_group = 'teenager';
  } else if (/\b(child|children|kid|kids)\b/.test(query)) {
    filters.age_group = 'child';
  }

  // ─── AGE RANGE ───
  const aboveMatch = query.match(/\b(?:above|over|older than|greater than|more than)\s+(\d+)/);
  if (aboveMatch) {
    filters.min_age = parseInt(aboveMatch[1]);
  }

  const belowMatch = query.match(/\b(?:below|under|younger than|less than)\s+(\d+)/);
  if (belowMatch) {
    filters.max_age = parseInt(belowMatch[1]);
  }

  const betweenMatch = query.match(/\bbetween\s+(\d+)\s+and\s+(\d+)\b/);
  if (betweenMatch) {
    filters.min_age = parseInt(betweenMatch[1]);
    filters.max_age = parseInt(betweenMatch[2]);
  }

  const agedMatch = query.match(/\baged?\s+(\d+)\s*(?:to|-)\s*(\d+)\b/);
  if (agedMatch) {
    filters.min_age = parseInt(agedMatch[1]);
    filters.max_age = parseInt(agedMatch[2]);
  }

  // ─── COUNTRY ───
  // look for "from <country>" pattern
  const fromMatch = query.match(/\bfrom\s+([a-z\s]+?)(?:\s+(?:above|below|over|under|aged?|who|and|with|$)|$)/);
  if (fromMatch) {
    const words = fromMatch[1].trim().split(/\s+/);
    // try multi-word first then single word
    for (let len = words.length; len >= 1; len--) {
      const countryName = words.slice(0, len).join(' ').trim();
      const countryCode = countryMap[countryName];
      if (countryCode) {
        filters.country_id = countryCode;
        break;
      }
    }
  }

  // if nothing was parsed return null
  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
}

module.exports = { parseQuery };