import { rules, validate } from '../src/index'

const resultados = validate('xcv', rules({label: 'Mi número'}).isInteger())

console.log(resultados)