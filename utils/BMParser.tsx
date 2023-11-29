type BMBlacklist = string[];

type BMWhitelistEntry = {
  [name: string] : {
    profit?:number,
    profit_percentage?: number
  }
}

type BMWhitelist = BMWhitelistEntry[];

type BMTrueBlacklist = string[];

type BMFilter = {
  blackist: BMBlacklist,
  whitelist: BMWhitelist,
  true_blacklist: BMTrueBlacklist,
  global:{
    profit: number,
    profit_percentage: number
  }
}

export const convert = (input: BMFilter) => {
  // construct tbl to forceblacklist
  const output = {}
  for (const TBLEntry of input.true_blacklist){
    output['blacklist']
  }
  return output
}