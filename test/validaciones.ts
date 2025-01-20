import { rules } from '../src/index'

const original = {
	uno: 'hola',
	dos: 'er',
	tres: '67',
	cuatro: {
		aaa: '2024-10-28 23:56:00',
		bbb: 'fgh'
	},
	cinco: [23, {
		ccc: 'asd'
	}]
}

const otro = 56

const resultados = rules({ label: 'Body' }).isObject({
	uno: rules({ label: 'Uno', required: true }).isNatural(),
	dos: rules().isBoolean(),
	tres: rules({ required: true }).isNaturalNoZero(),
	cuatro: rules({ label: 'Cuatro', default: {} }).isObject({
		aaa: rules().isDateTime()
	}),
	cinco: rules().isArray(i => rules({ label: `Elem ${i + 1}` }).isObject({
		ccc: rules().isNumber()
	}))
}).validate<typeof original>(original)

console.log(original, resultados)