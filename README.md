# pols-validator

Un validador y sanitizador de datos ligero, síncrono, fluido y altamente extensible para **JavaScript** y **TypeScript**.

Inspirado en la filosofía de validación secuencial y filtrado en línea, `pols-validator` te permite validar la estructura de tus datos y sanitizarlos o transformarlos en un solo paso utilizando una API fluida basada en encadenamiento de métodos.

---

## Características Principales

* 🔗 **API Fluida**: Encadenamiento intuitivo de reglas que se lee como lenguaje natural.
* 🧼 **Híbrido de Validación y Sanitización**: Valida y transforma tus datos (mayúsculas, redondeos, limpieza de espacios, etc.) en un solo flujo.
* 📦 **Coerción de Tipos Inteligente**: Convierte cadenas a objetos `Date`, números o valores booleanos automáticamente.
* 🔒 **Reutilización Segura de Esquemas**: Sin mutaciones colaterales ni acumulación de prefijos en las etiquetas al validar múltiples registros.
* 🚀 **Extensible y DX Avanzado**: Añade validaciones rápidas en línea con `.custom()` o extiende la librería con tus propios métodos autocompletados mediante `createRulesCreator()`.
* 🛡️ **Seguridad contra Parameter Pollution**: Al validar objetos con un esquema, los campos adicionales no definidos son ignorados automáticamente en la salida sanitizada.

---

## Instalación

```bash
npm install pols-validator
```

---

## Uso Básico

```typescript
import { rules } from 'pols-validator';

// 1. Definir el esquema
const schema = rules().isObject({
	nombre: rules('Nombre').isString().capitalize().trim(),
	correo: rules('Correo').isEmailAddress().lower(),
	edad: rules('Edad').required().isInteger().isGte(18),
	activo: rules('Estado').isBoolean()
});

// 2. Validar
const resultado = schema.validate({
	nombre: "  jean sanchez  ",
	correo: "JEAN@ASD.COM",
	edad: "25", // Se coerciona a número automáticamente
	activo: "SÍ", // Se coerciona a true automáticamente
	extra: "este campo se eliminará" // Campo no definido
});

if (resultado.success) {
	console.log(resultado.sanitized);
	/* Salida:
	{
		nombre: "Jean sanchez",
		correo: "jean@asd.com",
		edad: 25,
		activo: true
	}
	*/
} else {
	console.error(resultado.messages); // Array de strings con los mensajes de error en español
}
```

---

## Métodos de Validación Disponibles

### Cadenas y Texto
* `.isString()`: Valida que sea una cadena de texto (o convierte números a texto).
* `.isAlphanumeric()`: Valida que contenga solo letras y números (soporta caracteres del español como `ñ`, tildes y diéresis).
* `.isEmailAddress()`: Valida formato de correo electrónico (soporta subdireccionamiento de correo `+`).
* `.match(pattern: RegExp)`: Valida contra una expresión regular personalizada.
* `.maxLength(limit: number)`: Valida la longitud máxima del texto (o elementos de un array).
* `.minLength(limit: number)`: Valida la longitud mínima del texto (o elementos de un array).
* `.hasFixedLength(limit: number)`: Valida la longitud exacta del texto (o elementos de un array).

### Números
* `.isNumber()`: Valida y coerciona a tipo numérico.
* `.isInteger()`: Valida que sea un número entero.
* `.isNumeric()`: Valida que la cadena contenga únicamente dígitos numéricos (`0-9`).
* `.isNatural()`: Valida enteros mayores o iguales a 0.
* `.isNaturalNoZero()`: Valida enteros mayores a 0.
* `.isGt(limit: number)`: Mayor que.
* `.isGte(limit: number)`: Mayor o igual que.
* `.isLt(limit: number)`: Menor que.
* `.isLte(limit: number)`: Menor o igual que.

### Fechas y Horas
* `.isDateTime()`: Valida y coerciona a un objeto `PDate` (de `pols-date`).
* `.isDate()`: Valida, coerciona a `PDate` y limpia la hora (`clearClockTime`).
* `.isTime()`: Valida formatos de hora (AM/PM y duración) y los estandariza al formato de 24 horas `HH:MM:SS`.
* `.beforeOrSameAsNow()`: Valida que la fecha/hora sea anterior o igual al momento actual.

### Colecciones y Estructuras
* `.isObject(schema?: Record<string, PRules>)`: Valida objetos y aplica esquemas anidados.
* `.isArray(rulesGenerator?: (index: number) => PRules)`: Valida arrays y aplica reglas opcionales por elemento.
* `.hasElements()`: Valida que el array no esté vacío.
* `.isIn(...elements: any[])`: Valida que el valor (o elementos del array) esté en la lista permitida.
* `.isNotIn(...elements: any[])`: Valida que el valor no esté en la lista prohibida.

### Booleanos
* `.isBoolean()`: Valida y coerciona valores a booleanos (`true` para `1`, `"S"`, `"SÍ"`, `"Y"`, `"YES"`, `"TRUE"`; `false` para `0`, `"N"`, `"NO"`, `"FALSE"`).

### Transformaciones y Filtros
* `.upper()`: Convierte el texto a mayúsculas.
* `.lower()`: Convierte el texto a minúsculas.
* `.capitalize()`: Capitaliza la primera letra del texto.
* `.trim()`: Limpia espacios en blanco iniciales y finales (se ejecuta por defecto al iniciar `validate`).
* `.cleanDoubleSpaces()`: Reemplaza múltiples espacios consecutivos por un espacio simple.
* `.noSpaces()`: Valida que la cadena no tenga ningún espacio.
* `.replace(search, replace)`: Reemplaza coincidencias en cadenas.
* `.split(separator)`: Divide una cadena en un array.
* `.join(separator)`: Une un array en una cadena.
* `.round(decimals)`: Redondea un número a ciertos decimales.
* `.floor()`: Aplica redondeo hacia abajo (`Math.floor`).
* `.ceil()`: Aplica redondeo hacia arriba (`Math.ceil`).
* `.sanitize(params?: PSanitizeParams)`: Limpia código HTML malicioso usando `isomorphic-dompurify`.

---

## Características Avanzadas

### 1. Validaciones Personalizadas en Línea (`.custom`)
Puedes inyectar una validación dinámica en cualquier cadena de reglas sin extender la librería:

```typescript
const schema = rules("Puerto").isInteger().custom(
	(value) => value >= 1024 && value <= 65535,
	"El puerto debe estar en el rango de puertos de usuario (1024-65535)"
);
```

### 2. Extender con Métodos Propios (`createRulesCreator`)
Si deseas añadir métodos con nombre propio a tu validador y que tu editor de código (como VS Code) los **reconozca y autocomplete automáticamente**, puedes extender la clase `PRules` y generar tu propio constructor `rules` usando `createRulesCreator`:

```typescript
import { PRules, createRulesCreator } from 'pols-validator';

// 1. Extender PRules con tus propios métodos
class MisReglas extends PRules {
	isDNI() {
		return this.add('isDNI', (wrapper) => {
			if (!(wrapper.value as string).match(/^[0-9]{8}[A-Z]$/)) {
				return `'${wrapper.label}' no es un DNI español válido`;
			}
		});
	}
}

// 2. Crear tu constructor personalizado (TypeScript infiere el tipo completo)
export const myRules = createRulesCreator(MisReglas);

// 3. Uso con autocompletado nativo
const resultado = myRules("Documento").isString().isDNI().validate("12345678Z");
```

---

## Licencia

ISC
