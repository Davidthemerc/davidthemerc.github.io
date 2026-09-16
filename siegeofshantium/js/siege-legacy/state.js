'use strict';
function newLegacySiegeState(name,difficulty){const s=newState(name,difficulty,'legacy_siege');s.mode='legacy_siege';s.siegeII=null;s.world=null;return s}
