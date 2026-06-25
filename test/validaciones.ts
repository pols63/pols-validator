import { rules } from '../src/index'

console.log("--- Pruebas originales con renombrado isString ---")
const objeto = {
	Correo: 'asd@asd.com',
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
		uno: rules().isString(),
		dos: rules().isNatural()
	})),
	Elementos: rules().isArray(i => rules(`Elemento ${i + 1}`).isNumber())
}).validate(objeto)

console.log("Original validation result:", JSON.stringify(v, null, 2))

console.log("\n--- Pruebas de conversión de hora en isTime ---")
const pmResult = rules().isTime().validate("12:30pm") as any
console.log("12:30pm ->", pmResult.sanitized)
console.assert(pmResult.sanitized === "12:30:00", "ERROR: 12:30pm debería ser 12:30:00")

const amResult = rules().isTime().validate("12:30am") as any
console.log("12:30am ->", amResult.sanitized)
console.assert(amResult.sanitized === "00:30:00", "ERROR: 12:30am debería ser 00:30:00")

const normalPmResult = rules().isTime().validate("1:30pm") as any
console.log("1:30pm ->", normalPmResult.sanitized)
console.assert(normalPmResult.sanitized === "13:30:00", "ERROR: 1:30pm debería ser 13:30:00")

console.log("\n--- Pruebas de longitud exacta en hasFixedLength ---")
const fixedLenGood = rules().hasFixedLength(8).validate("12345678") as any
console.log("8 chars (hasFixedLength 8) -> error:", fixedLenGood.error)
console.assert(fixedLenGood.error === false, "ERROR: 8 caracteres debería ser válido para hasFixedLength(8)")

const fixedLenTooLong = rules().hasFixedLength(8).validate("1234567890") as any
console.log("10 chars (hasFixedLength 8) -> error:", fixedLenTooLong.error)
console.assert(fixedLenTooLong.error === true, "ERROR: 10 caracteres debería ser inválido para hasFixedLength(8)")

console.log("\n--- Pruebas de booleanos en mayúsculas ---")
const boolTrueResult = rules().isBoolean().validate("TRUE") as any
console.log("TRUE -> sanitized:", boolTrueResult.sanitized, "error:", boolTrueResult.error)
console.assert(boolTrueResult.sanitized === true && !boolTrueResult.error, "ERROR: TRUE debería ser true")

const boolFalseResult = rules().isBoolean().validate("FALSE") as any
console.log("FALSE -> sanitized:", boolFalseResult.sanitized, "error:", boolFalseResult.error)
console.assert(boolFalseResult.sanitized === false && !boolFalseResult.error, "ERROR: FALSE debería ser false")

console.log("\n--- Pruebas de reutilización de esquema (mutación de etiquetas) ---")
const itemSchema = rules('Usuario').isObject({
	nombre: rules('Nombre').isString()
})

itemSchema.validate({ nombre: "Jean" })
itemSchema.validate({ nombre: "Sánchez" })
// Let's run a validation that fails to see the error label path
const failedRun = itemSchema.validate({ nombre: {} }) as any
console.log("Mensaje de error (primera falla):", failedRun.messages)
console.assert(failedRun.messages[0] === "'Usuario > Nombre' debe ser una cadena de texto", `ERROR: Etiqueta incorrecta: ${failedRun.messages[0]}`)

const failedRun2 = itemSchema.validate({ nombre: true }) as any
console.log("Mensaje de error (segunda falla):", failedRun2.messages)
console.assert(failedRun2.messages[0] === "'Usuario > Nombre' debe ser una cadena de texto", `ERROR: La etiqueta acumuló prefijos: ${failedRun2.messages[0]}`)

console.log("\n¡Pruebas completadas!")