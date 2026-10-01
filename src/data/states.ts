export interface StateInfo {
  fips: string;
  name: string;
  postal: string;
}

const TABLE: [fips: string, postal: string, name: string][] = [
  ['01', 'AL', 'Alabama'],
  ['02', 'AK', 'Alaska'],
  ['04', 'AZ', 'Arizona'],
  ['05', 'AR', 'Arkansas'],
  ['06', 'CA', 'California'],
  ['08', 'CO', 'Colorado'],
  ['09', 'CT', 'Connecticut'],
  ['10', 'DE', 'Delaware'],
  ['11', 'DC', 'District of Columbia'],
  ['12', 'FL', 'Florida'],
  ['13', 'GA', 'Georgia'],
  ['15', 'HI', 'Hawaii'],
  ['16', 'ID', 'Idaho'],
  ['17', 'IL', 'Illinois'],
  ['18', 'IN', 'Indiana'],
  ['19', 'IA', 'Iowa'],
  ['20', 'KS', 'Kansas'],
  ['21', 'KY', 'Kentucky'],
  ['22', 'LA', 'Louisiana'],
  ['23', 'ME', 'Maine'],
  ['24', 'MD', 'Maryland'],
  ['25', 'MA', 'Massachusetts'],
  ['26', 'MI', 'Michigan'],
  ['27', 'MN', 'Minnesota'],
  ['28', 'MS', 'Mississippi'],
  ['29', 'MO', 'Missouri'],
  ['30', 'MT', 'Montana'],
  ['31', 'NE', 'Nebraska'],
  ['32', 'NV', 'Nevada'],
  ['33', 'NH', 'New Hampshire'],
  ['34', 'NJ', 'New Jersey'],
  ['35', 'NM', 'New Mexico'],
  ['36', 'NY', 'New York'],
  ['37', 'NC', 'North Carolina'],
  ['38', 'ND', 'North Dakota'],
  ['39', 'OH', 'Ohio'],
  ['40', 'OK', 'Oklahoma'],
  ['41', 'OR', 'Oregon'],
  ['42', 'PA', 'Pennsylvania'],
  ['44', 'RI', 'Rhode Island'],
  ['45', 'SC', 'South Carolina'],
  ['46', 'SD', 'South Dakota'],
  ['47', 'TN', 'Tennessee'],
  ['48', 'TX', 'Texas'],
  ['49', 'UT', 'Utah'],
  ['50', 'VT', 'Vermont'],
  ['51', 'VA', 'Virginia'],
  ['53', 'WA', 'Washington'],
  ['54', 'WV', 'West Virginia'],
  ['55', 'WI', 'Wisconsin'],
  ['56', 'WY', 'Wyoming'],
];

export const DC_FIPS = '11';
export const MARYLAND_FIPS = '24';
export const ALASKA_FIPS = '02';
export const HAWAII_FIPS = '15';

export const STATES: Record<string, StateInfo> = Object.fromEntries(
  TABLE.map(([fips, postal, name]) => [fips, { fips, postal, name }]),
);

/** The 50 states, excluding DC. us-atlas also contains 60, 66, 69, 72, 78 (territories), which are never in this table. */
export const FIFTY_STATES: string[] = TABLE.map(([fips]) => fips).filter((f) => f !== DC_FIPS);

export function stateInfo(fips: string): StateInfo | undefined {
  return STATES[fips];
}
