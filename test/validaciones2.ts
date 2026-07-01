import { PDate } from 'pols-date'
import { rules, PRules } from '../src/index'

// Test 1: Verificar que lanza excepción si PDateClass no está definida
console.log('--- Test de Excepción sin PDateClass ---')
try {
	rules().isDate().validate(new PDate('2026-07-01'))
	console.log('Fallo: No se lanzó la excepción esperada.')
} catch (e: any) {
	console.log('Éxito: Se lanzó la excepción esperada.')
	console.log('Mensaje de error:', e.message)
}

// Configurar la clase estática
PRules.PDateClass = PDate
console.log('\nDefinido PRules.PDateClass = PDate')

// Caso 1: Validar un PDate a nivel superior
const dateInput = new PDate('2026-07-01')
const schemaDirect = rules().isDate()
const resultDirect = schemaDirect.validate(dateInput) as any

console.log('\n--- Caso 1: PDate Directo ---')
console.log('Original Direct:', dateInput.toString())
if (resultDirect.success) {
	const sanitizedDate = resultDirect.sanitized as PDate
	console.log('Sanitized Direct:', sanitizedDate.toString())
	console.log('Constructor Direct es PDate:', sanitizedDate instanceof PDate)
	console.log('¿Mantiene la misma fecha?:', sanitizedDate.toString() === dateInput.toString())
} else {
	console.log('Error Direct:', resultDirect.messages)
}

// Caso 2: Validar un PDate anidado en un objeto
const payloadObj = {
	fecha: new PDate('2026-07-01')
}
const schemaObj = rules().isObject({
	fecha: rules().isDate()
})
const resultObj = schemaObj.validate(payloadObj) as any

console.log('\n--- Caso 2: PDate Anidado ---')
console.log('Original Anidado:', payloadObj.fecha.toString())
if (resultObj.success) {
	const sanitizedObj = resultObj.sanitized as typeof payloadObj
	console.log('Sanitized Anidado:', sanitizedObj.fecha.toString())
	console.log('Constructor Anidado es PDate:', sanitizedObj.fecha instanceof PDate)
	console.log('¿Mantiene la misma fecha?:', sanitizedObj.fecha.toString() === payloadObj.fecha.toString())
} else {
	console.log('Error Anidado:', resultObj.messages)
}

// Caso 3: Validar un arreglo de objetos que contienen PDate
const payloadArray = {
	fechas: [
		{ valor: new PDate('2026-07-01') },
		{ valor: new PDate('2026-12-25') }
	]
}
const schemaArray = rules().isObject({
	fechas: rules().isArray(() => rules().isObject({
		valor: rules().isDate()
	}))
})
const resultArray = schemaArray.validate(payloadArray) as any

console.log('\n--- Caso 3: PDate en Arreglo ---')
if (resultArray.success) {
	const sanitizedArray = resultArray.sanitized as typeof payloadArray
	console.log('Sanitized Arreglo [0]:', sanitizedArray.fechas[0].valor.toString())
	console.log('Sanitized Arreglo [1]:', sanitizedArray.fechas[1].valor.toString())
	console.log('Constructor es PDate:', sanitizedArray.fechas[0].valor instanceof PDate)
} else {
	console.log('Error Arreglo:', resultArray.messages)
}
