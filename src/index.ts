import { Rules } from "./rules"
import { RulesParams } from "./rulesEngine"

export { RulesEngine } from './rulesEngine'

export { EvaluateResponse, validate } from './validate'

export const rules = (params?: RulesParams) => new Rules(params)