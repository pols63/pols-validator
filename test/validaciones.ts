import { PDate } from 'pols-date'
import { rules } from '../src/index'

const original = {
	uno: new PDate,
	dos: new PDate,
}

const otro = 56

const resultados = rules({ label: 'Body' }).isObject({
	uno: rules().isDate(),
	dos: rules().isDate(),
	// tres: rules({ required: true }).isNaturalNoZero(),
	// cuatro: rules({ label: 'Cuatro', default: {} }).isObject({
	// 	aaa: rules().isDateTime()
	// }),
	// cinco: rules().isArray(i => rules({ label: `Elem ${i + 1}` }).isObject({
	// 	ccc: rules().isNumber()
	// }))
}).validate<typeof original>(original)

console.log(original, resultados)

// console.log(rules().isTime().validate('23:59:59'))