---
name: pols-validator
description: Guidelines and instructions for validating, coercing, and sanitizing data using pols-validator in JavaScript/TypeScript.
---

# pols-validator

`pols-validator` es una librería fluida, liviana y síncrona para validar, coercionar y sanitizar datos en proyectos JavaScript y TypeScript.

---

## Uso Básico

```typescript
import { rules } from 'pols-validator'

// 1. Definir el esquema
const schema = rules().isObject({
	nombre: rules('Nombre').isString().capitalize().trim(),
	correo: rules('Correo').isEmailAddress().lower(),
	edad: rules({ label: 'Edad', required: true }).isInteger().isGte(18),
	activo: rules().isBoolean()
})

// 2. Validar
const resultado = schema.validate(payload)

if (resultado.success) {
	console.log(resultado.sanitized)
} else {
	console.error(resultado.messages) // Array de strings con mensajes de error
}
```

---

## API de Validación

### Cadenas y Texto
- `.isString()`: Convierte números a texto o valida que sea cadena.
- `.isAlphanumeric()`: Letras y números (soporta caracteres del español `ñ`, tildes, etc.).
- `.isEmailAddress()`: Formato de correo válido.
- `.match(pattern: RegExp)`: Coincidencia con expresión regular.
- `.maxLength(limit)`: Longitud máxima.
- `.minLength(limit)`: Longitud mínima.
- `.hasFixedLength(limit)`: Longitud exacta.

### Números
- `.isNumber()`: Valida y coerciona a tipo numérico (limpia comas y espacios).
- `.isInteger()`: Valida enteros.
- `.isNatural()`: Enteros $\ge 0$.
- `.isNaturalNoZero()`: Enteros $> 0$.
- `.isNumeric()`: Valida que contenga únicamente dígitos `0-9`.
- `.isGt(limit)` / `.isGte(limit)` / `.isLt(limit)` / `.isLte(limit)`: Comparaciones numéricas.

### Fechas y Horas
- `.isDateTime()`: Valida y coerciona a objeto `PDate` (de `pols-date`).
- `.isDate()`: Coerciona a `PDate` y limpia la hora (`clearClockTime`).
- `.isTime()`: Convierte formatos AM/PM y duración a formato de 24 horas `HH:MM:SS`.
- `.beforeOrSameAsNow()`: Fecha anterior o igual al momento actual.

### Colecciones y Estructuras
- `.isObject(schema?: Record<string, PRules>)`: Aplica un esquema anidado a un objeto.
- `.isArray(rulesGenerator?: (index: number) => PRules)`: Valida arreglos y aplica reglas personalizadas por elemento.
- `.hasElements()`: Valida que el arreglo no esté vacío.
- `.isIn(...elements)` / `.isNotIn(...elements)`: Validación de membresía.

### Booleanos
- `.isBoolean()`: Coerciona cadenas/números a booleanos (ej. `"TRUE"`, `"SÍ"`, `1` a `true`).

---

## Transformaciones y Sanitización
- `.upper()` / `.lower()`: Conversión de caja de texto.
- `.capitalize()`: Capitaliza la primera letra.
- `.trim()`: Limpia espacios iniciales/finales (se aplica automáticamente al inicio de `validate`).
- `.cleanDoubleSpaces()`: Reemplaza dobles espacios consecutivos por uno solo.
- `.noSpaces()`: Valida que la cadena no contenga ningún espacio.
- `.replace(search, replace)`: Reemplaza coincidencias en cadenas.
- `.split(separator)`: Divide una cadena en un array.
- `.join(separator)`: Une un array en una cadena.
- `.round(decimals)` / `.floor()` / `.ceil()`: Redondeo matemático.
- `.sanitize(params?)`: Limpia contenido HTML para prevenir XSS.

---

## Características de Diseño Importantes

### Construcción de Rutas de Error Anidadas
Cuando ocurre un fallo de validación dentro de un objeto (`isObject`) o arreglo (`isArray`), la librería construye automáticamente la ruta completa del error usando `nestedLabel` de manera secuencial separada por `>`.

1. **Ignorar etiquetas de contenedor raíz**: Si un esquema o contenedor raíz no tiene etiqueta (se crea con `rules()` o `rules({ default: {} })`), no se prependeará `'El valor'` en la ruta del error nested.
2. **Omitir elementos sin etiqueta en arreglos**: Si los elementos del arreglo se validan sin etiqueta (ej. `isArray(i => rules().isObject(...))`), la ruta omitirá el nivel del elemento e irá directamente del contenedor padre al campo hijo (`Lista de Aprobadores > ID de Aprobador`).
3. **Comportamiento dinámico**: Si se especifica una etiqueta para el elemento del arreglo (ej. `rules({ label: 'Aprobador ' + (i + 1) })`), esta se renderizará de forma secuencial (`Lista de Aprobadores > Aprobador 1 > ID de Aprobador`).
