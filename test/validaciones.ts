import { PDate } from 'pols-date'
import { rules } from '../src/index'

const objeto = {
	Correo: 'asd@asd.com89',
	Detalles: [{
		uno: {},
		dos: 'qwe'
	}, {
		uno: 'neo',
		dos: 'bnbn'
	}],
	Elementos: ['asd', 56]
}

const v = rules().isObject({
	Correo: rules().isEmailAddress(),
	Detalles: rules().hasElements(i => rules(`Detalle ${i + 1}`).isObject({
		uno: rules().isAlphanumeric(),
		dos: rules().isNatural()
	})),
	Elementos: rules().isArray(i => rules(`Elemento ${i + 1}`).isNumber())
}).validate(objeto)

console.log(v)