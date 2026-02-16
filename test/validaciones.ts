import { PDate } from 'pols-date'
import { rules } from '../src/index'

const objeto = {
	Detalles: `[{ "Prop": 1 }]`
}

const v = rules({default: {}}).isObject({
	Detalles: rules().hasElements(i => rules().isObject())
}).validate(objeto)

console.log(v)