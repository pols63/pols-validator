import { PDate } from 'pols-date'
import { rules } from '../src/index'

const objeto = {
	Correo: 'asd@asd.com89',
	// Otro: {}
}

const v = rules().isObject({
	// Detalles: rules().hasElements(i => rules().isObject()),
	// Otro: rules(true).isObject(),
	Correo: rules().isEmailAddress()
}).validate(objeto)

console.log((v as any)['messages'])