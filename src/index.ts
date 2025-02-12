import { PRules } from "./rules"
import { PRulesParams } from "./rulesEngine"

export const rules = (params?: PRulesParams) => new PRules(params)

export { PRules, PRulesParams }

export { PRulesResponse, PRulesWrapper, PRulesFunction } from './rulesEngine'