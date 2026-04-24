// utils/parser.js

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
  sierra: 'SL',
  guinea: 'GN',
  gambia: 'GM',
  mauritania: 'MR',
  eritrea: 'ER',
  burundi: 'BI',
  gabon: 'GA',
  lesotho: 'LS',
  swaziland: 'SZ',
  comoros: 'KM',
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
};

function parseQuery(q) {
  // convert to lowercase so "Nigeria" and "nigeria" both work
  const query = q.toLowerCase().trim();

  // this is the filters object we will build up and return
  const filters = {};

  // ─────────────────────────────────────
  // 1. DETECT GENDER
  // ─────────────────────────────────────
  // check if the query contains any gender related words
  if (query.includes('female') || query.includes('females') || query.includes('women') || query.includes('woman') || query.includes('girls') || query.includes('girl')) {
    filters.gender = 'female';
  } else if (query.includes('male') || query.includes('males') || query.includes('men') || query.includes('man') || query.includes('boys') || query.includes('boy')) {
    filters.gender = 'male';
  }
  // note: "male and female" means no gender filter — both genders wanted
  if (query.includes('male and female') || query.includes('female and male') || query.includes('both')) {
    delete filters.gender;
  }

  // ─────────────────────────────────────
  // 2. DETECT AGE GROUP
  // ─────────────────────────────────────
  if (query.includes('young')) {
    // young is not a stored age group
    // it maps to ages 16-24 for searching only
    filters.min_age = 16;
    filters.max_age = 24;
  } else if (query.includes('senior') || query.includes('seniors') || query.includes('elderly') || query.includes('old')) {
    filters.age_group = 'senior';
  } else if (query.includes('adult') || query.includes('adults')) {
    filters.age_group = 'adult';
  } else if (query.includes('teenager') || query.includes('teenagers') || query.includes('teen') || query.includes('teens')) {
    filters.age_group = 'teenager';
  } else if (query.includes('child') || query.includes('children') || query.includes('kids') || query.includes('kid')) {
    filters.age_group = 'child';
  }

  // ─────────────────────────────────────
  // 3. DETECT AGE RANGE
  // ─────────────────────────────────────
  // looks for patterns like "above 30", "over 25", "below 40", "under 20"

  // above/over pattern — sets min_age
  // the regex looks for the word "above" or "over" followed by a number
  const aboveMatch = query.match(/(?:above|over|older than)\s+(\d+)/);
  if (aboveMatch) {
    // aboveMatch[1] is the number captured by (\d+)
    filters.min_age = parseInt(aboveMatch[1]);
  }

  // below/under pattern — sets max_age
  const belowMatch = query.match(/(?:below|under|younger than)\s+(\d+)/);
  if (belowMatch) {
    filters.max_age = parseInt(belowMatch[1]);
  }

  // between pattern — "between 20 and 40"
  const betweenMatch = query.match(/between\s+(\d+)\s+and\s+(\d+)/);
  if (betweenMatch) {
    filters.min_age = parseInt(betweenMatch[1]);
    filters.max_age = parseInt(betweenMatch[2]);
  }

  // ─────────────────────────────────────
  // 4. DETECT COUNTRY
  // ─────────────────────────────────────
  // look for the word "from" followed by a country name
  const fromMatch = query.match(/from\s+([a-z\s]+?)(?:\s+(?:above|below|over|under|aged|who|and|$))/);
  
  if (fromMatch) {
    // extract the country name and remove extra spaces
    const countryName = fromMatch[1].trim();
    // look it up in our mapping
    const countryCode = countryMap[countryName];
    if (countryCode) {
      filters.country_id = countryCode;
    }
  } else if (query.includes('from ')) {
    // simpler fallback — get everything after "from"
    const afterFrom = query.split('from ')[1];
    if (afterFrom) {
      // take just the first word after "from"
      const countryName = afterFrom.split(' ')[0].trim();
      const countryCode = countryMap[countryName];
      if (countryCode) {
        filters.country_id = countryCode;
      }
    }
  }

  // ─────────────────────────────────────
  // 5. CHECK IF ANYTHING WAS PARSED
  // ─────────────────────────────────────
  // if filters is still empty nothing was understood
  // return null to signal the controller to return 
  // "Unable to interpret query"
  if (Object.keys(filters).length === 0) {
    return null;
  }

  return filters;
}

module.exports = { parseQuery };