# 📱 **GUÍA COMPLETA: TESTING EN ANDROID STUDIO**

## 🎯 **ESTADO ACTUAL: LISTO PARA TESTING MÓVIL**

✅ **Build completado exitosamente**  
✅ **Capacitor sincronizado**  
✅ **Android Studio abierto**  

---

## 🔧 **PASOS EN ANDROID STUDIO**

### **1. VERIFICAR PROYECTO ABIERTO**
- ✅ Android Studio debería haberse abierto automáticamente
- ✅ Verifica que el proyecto "android" esté cargado
- ✅ Espera a que termine la indexación (barra de progreso abajo)

### **2. CONFIGURAR DISPOSITIVO DE PRUEBA**

#### **Opción A: Emulador Android (Recomendado)**
1. **Abrir AVD Manager**:
   - Clic en `Tools` → `AVD Manager`
   - O clic en el ícono de teléfono en la toolbar

2. **Crear/Seleccionar Emulador**:
   - Si no tienes emulador: `Create Virtual Device`
   - Selecciona: **Pixel 7** o **Pixel 6**
   - Sistema: **Android 13 (API 33)** o superior
   - Clic en `Next` → `Finish`

3. **Iniciar Emulador**:
   - Clic en el botón ▶️ junto al emulador
   - Espera a que arranque completamente

#### **Opción B: Dispositivo Físico**
1. **Habilitar Modo Desarrollador** en tu Android:
   - `Configuración` → `Acerca del teléfono`
   - Toca 7 veces en `Número de compilación`

2. **Habilitar USB Debugging**:
   - `Configuración` → `Opciones de desarrollador`
   - Activar `Depuración USB`

3. **Conectar por USB**:
   - Conecta tu teléfono por USB
   - Acepta la autorización en el teléfono

### **3. EJECUTAR LA APP**

#### **Método 1: Botón Run**
1. **Verificar configuración**:
   - En la toolbar superior, verifica que diga `app`
   - Al lado debe aparecer tu dispositivo/emulador

2. **Ejecutar**:
   - Clic en el botón ▶️ verde (`Run 'app'`)
   - O presiona `Shift + F10`

#### **Método 2: Gradle Build**
1. **Abrir terminal en Android Studio**:
   - `View` → `Tool Windows` → `Terminal`

2. **Ejecutar comando**:
   ```bash
   ./gradlew assembleDebug
   ./gradlew installDebug
   ```

### **4. VERIFICAR INSTALACIÓN**
- ✅ La app debería instalarse automáticamente
- ✅ Busca el ícono "RentaFlux" en el dispositivo
- ✅ Toca para abrir la aplicación

---

## 🧪 **QUÉ PROBAR EN LA APP MÓVIL**

### **✅ FUNCIONALIDADES BÁSICAS**
1. **Login/Registro**:
   - Probar autenticación
   - Verificar campos de validación
   - Comprobar navegación

2. **Dashboard**:
   - Verificar carga de datos
   - Probar navegación entre secciones
   - Comprobar responsive design

3. **Gestión de Propiedades**:
   - Crear nueva propiedad
   - Editar propiedad existente
   - Verificar formularios

4. **Gestión de Inquilinos**:
   - Agregar nuevo inquilino
   - Editar información
   - Asignar a unidades

### **✅ TESTING DE UX MÓVIL**
1. **Navegación**:
   - Menú hamburguesa
   - Navegación por tabs
   - Botones de retroceso

2. **Formularios**:
   - Teclado virtual
   - Validación en tiempo real
   - Scroll en formularios largos

3. **Performance**:
   - Velocidad de carga
   - Transiciones suaves
   - Respuesta táctil

---

## 🚨 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **❌ Error: "SDK not found"**
**Solución**:
1. `File` → `Project Structure`
2. `SDK Location` → Configurar Android SDK path
3. Típicamente: `C:\\Users\\[Usuario]\\AppData\\Local\\Android\\Sdk`

### **❌ Error: "Gradle sync failed"**
**Solución**:
1. `File` → `Sync Project with Gradle Files`
2. O clic en el ícono de sincronización en la toolbar

### **❌ Error: "Device not found"**
**Solución**:
1. Verificar que el emulador esté corriendo
2. O que el dispositivo físico esté conectado
3. `Tools` → `AVD Manager` para gestionar emuladores

### **❌ Error: "App crashes on startup"**
**Solución**:
1. Verificar logs en `Logcat` (abajo en Android Studio)
2. Buscar errores en rojo
3. Verificar que Supabase esté configurado correctamente

---

## 📊 **COMANDOS ÚTILES PARA DESARROLLO**

### **Desde tu Terminal (fuera de Android Studio)**
```bash
# Rebuild y sync
npm run build && npx cap sync

# Abrir Android Studio
npx cap open android

# Ver logs en tiempo real
npx cap run android --livereload

# Build para release
npx cap build android
```

### **Desde Android Studio Terminal**
```bash
# Limpiar build
./gradlew clean

# Build debug
./gradlew assembleDebug

# Instalar en dispositivo
./gradlew installDebug

# Ver logs
adb logcat
```

---

## 🎯 **CHECKLIST DE TESTING MÓVIL**

### **✅ ANTES DE PROBAR**
- [ ] Build completado sin errores
- [ ] Capacitor sincronizado
- [ ] Android Studio abierto
- [ ] Emulador/dispositivo listo

### **✅ DURANTE EL TESTING**
- [ ] App se instala correctamente
- [ ] Login funciona
- [ ] Dashboard carga datos
- [ ] Navegación es fluida
- [ ] Formularios funcionan
- [ ] No hay crashes

### **✅ DESPUÉS DEL TESTING**
- [ ] Documentar bugs encontrados
- [ ] Verificar performance
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Comprobar orientación (portrait/landscape)

---

## 🚀 **PRÓXIMOS PASOS DESPUÉS DEL TESTING**

### **Si todo funciona bien:**
1. **Generar APK de release**:
   ```bash
   npx cap build android --release
   ```

2. **Subir a Google Play Console** (cuando esté listo)

3. **Configurar CI/CD** para builds automáticos

### **Si encuentras problemas:**
1. **Documentar errores** encontrados
2. **Revisar logs** en Logcat
3. **Ajustar configuración** según sea necesario

---

## 💡 **TIPS ADICIONALES**

### **🔧 Performance**
- Usa el **emulador Pixel 7** para mejor rendimiento
- Habilita **Hardware Acceleration** en AVD
- Cierra otras apps para liberar RAM

### **🐛 Debugging**
- Usa **Chrome DevTools** para debugging web
- **Logcat** para logs nativos de Android
- **Network Inspector** para verificar API calls

### **📱 Testing Real**
- Prueba en **diferentes tamaños** de pantalla
- Verifica **orientación** portrait y landscape
- Testa **conectividad** (WiFi/datos móviles)

---

## 🎉 **¡LISTO PARA PROBAR!**

Tu app RentaFlux está configurada y lista para testing en Android. 

**Pasos inmediatos:**
1. ✅ Verificar que Android Studio esté abierto
2. ✅ Iniciar emulador o conectar dispositivo
3. ✅ Clic en ▶️ para ejecutar la app
4. ✅ Probar funcionalidades principales

**¡Disfruta probando tu app en móvil! 📱✨**