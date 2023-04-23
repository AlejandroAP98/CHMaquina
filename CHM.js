M.AutoInit();

//lista de nemónicos para el procesador
//la función "reinicio" asigna 0 si es entero, flotante o booleano ó asigna "" si es una cadena, a la variable señalada por el operando
var lista= ["cargue","almacene","nueva","lea","sume","reste","multiplique","divida","potencia","modulo","concatene","elimine","extraiga","Y","O","NO","muestre","imprima","retorne\r","retorne","vaya","vayasi","etiqueta","reinicio"];
var memoria = new Array ();
var asignado=false;
var sizeDocumentos=0;
var primerDocumento = true;
var acumulador = 0;
var idDocumento = 0;
var diccionarioProcesos = {};
var idProceso = 1;
var index = 0;
var intervaloID = 0;
var modoPasoAPaso = false;
var documento=[];
var URLactual=[];

//Rango de memoria y valor actual
const sliderM = document.getElementById("memoryRange");
const valorM = document.getElementById("memoryValor");
//Rango de kernel y valor actual
const sliderK = document.getElementById("kernelRange");
const valorK = document.getElementById("kernelValor");
//modo del programa
document.getElementById("programMode").innerHTML = "Kernel"
// asignación de botones y funcion para ejecutar el programa en los dos modos diferentes
const botonEjecutarAuto=document.getElementById("btnAuto");
const botonEjecutarPasoAPaso=document.getElementById("btnPasoAPaso");
const botonPausar=document.getElementById("btnPausar");
const botonCargar=document.getElementById("btnCargar");
//
botonEjecutarAuto.addEventListener("click", function(){
    modoPasoAPaso = false;
    detenerIntervalo();
    iniciarIntervalo();
});
botonEjecutarPasoAPaso.addEventListener("click", function(){
    modoPasoAPaso = true;
    detenerIntervalo();
    iniciarIntervalo();
});
botonPausar.addEventListener("click", detenerIntervalo);

// Mostrar el valor actual del slider cuando se mueve
valorM.innerText = sliderM.value;
sliderM.addEventListener("input", function() {
    valorM.innerText = sliderM.value;
    sliderK.max = sliderM.value-2;
    valorK.innerText = sliderK.value;    
});
// Mostrar el valor actual del slider cuando se mueve
valorK.innerText = sliderK.value;
sliderK.addEventListener("input", function() {
    valorK.innerText = sliderK.value;
});

//evento de cargar archivo
const cargar=document.getElementById("fileInput");
///funciones--------------------------------------------------------------
cargar.addEventListener("change", function(){
    // leer el archivo
    const archivo = new FileReader();
    archivo.readAsText(document.getElementById("fileInput").files[0]);
    leerArchivo(archivo);
});
//funcion para leer archivo y validar sintaxis
function leerArchivo(archivo){
    const erroresArray = new Array();
    let sintaxisError=false;
    const diccionarioVariables = {}
    const diccionarioEtiquetas = {}
    let retorne = false;
    let sizeDocumento = 0;
    const apuntadorEtiqueta =[];
    const lineaEtiqueta =[];
    const logicas = [];
    const vaya = {};
    const vayasi = {};
    const cadena = [];
    const entero = [];
    const real = [];
    archivo.onload = () => {
        //separar por lineas y guardar en un array
        const lines = archivo.result.split('\n');
        //recorrer el array de lineas
        for ( let i = 0; i < lines.length; i++) {
            const line = lines[i];
            //separar por espacios y guardar en un array
            const words = line.split(" ");
            //recorrer el array de palabras
            //si la palabra es un nemónico
            if (lista.includes(words[0]) && !retorne){
                //si se está declarando una variable nueva
                if (words[0] == "nueva" && words.length >= 3) {
                    if (words[1] == "acumulador") {
                        erroresArray.push("Error 08 - Nombre reservado - Línea " + (i + 1));
                        sintaxisError = true;
                    } else if (words[1].length < 255 && esLetra(words[1]) && words.length == 4) {
                        if (!(words[1] in diccionarioVariables)) {
                            diccionarioVariables[words[1]] = quitarSlash(words[3]);
                            if (words[2] === "I") {
                                if (!((Number.isInteger(Number.parseInt(words[3]))) && !isNaN(words[3]) && (!words[3].includes(".")))) {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;
                                }else{
                                    entero.push(words[1]);
                                }
                            } else if (words[2] === "R") {
                                if (!(!isNaN(Number.parseFloat(words[3])) && !isNaN(words[3]))) {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;    
                                }else{
                                    real.push(words[1]);
                                }
                            } else if (words[2] === "L") {
                                if (words[3] === "1\r" || words[3] === "0\r") {
                                    logicas.push(words[1]);
                                } else {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;
                                }
                            }else if (words[2] === "C") {
                                if (!typeof words[3] === 'string') {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;   
                                }else{
                                    cadena.push(words[1]);
                                }
                            }
                        } else {
                            erroresArray.push("Error 03 - Variable ya declarada - Línea " + (i + 1));
                            sintaxisError = true;
                        }
                    }else if(words[1].length < 255 && esLetra(words[1]) && words.length == 3){
                        if (!(words[1] in diccionarioVariables)) {
                            if (words[2] === "I\r") {
                                diccionarioVariables[words[1]] = "0";
                            } else if (words[2] === "R\r") {

                                diccionarioVariables[words[1]] = "0.0";
                            } else if (words[2] === "L\r") {
                                logicas.push(words[1]);
                                diccionarioVariables[words[1]] = "0";
                            }else if (words[2] === "C\r") {
                                diccionarioVariables[words[1]] = " ";
                            }
                        } else {
                            erroresArray.push("Error 03 - Variable ya declarada - Línea " + (i + 1));
                            sintaxisError = true;
                        }
                    }else {
                        erroresArray.push("Error 01 - Error 06 - Sintaxis - Longitud - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                //si se está asignando una instrucción a una variable existente y validar si tiene un operador válido	
                } else if ((words[0] == "cargue" || words[0] == "lea" || words[0] == "sume" || words[0] == "reste" || words[0] == "multiplique" || words[0] == "divida" || words[0]==="potencia" || words[0] == "modulo" || words[0] == "concatene" || words[0] == "elimine" || words[0] == "extraiga" || words[0]==="almacene" || words[0]==="reinicio") && (words.length == 2) ) {
                    if (!((quitarSlash(words[1])) in diccionarioVariables)) {
                        erroresArray.push("Error 06 - Variable no declarada - Línea " + (i + 1));
                        sintaxisError = true;
                    } else if ((words[0] === "divida" || words[0]==="modulo") && (diccionarioVariables[quitarSlash(words[1])] === "0" || cadena.includes(quitarSlash(words[1])) || logicas.includes(quitarSlash(words[1])))){
                        erroresArray.push("Error 04 - Error en división  - Línea " + (i + 1));
                        sintaxisError = true;
                    }else if (words[0]==="potencia" && (!entero.includes(quitarSlash(words[1])))){
                        erroresArray.push("Error 09 - Potencia - Línea " + (i + 1));
                        sintaxisError = true;
                    }else if((words[0]==="sume" || words[0]==="reste" || words[0]==="multiplique" ) && (cadena.includes(quitarSlash(words[1])) || logicas.includes(quitarSlash(words[1])))){
                        erroresArray.push("Error 08 - Operaciones - Línea " + (i + 1));
                        sintaxisError = true;
                    }else if((words[0]==="elimine" || words[0]==="concatene") && (!cadena.includes(quitarSlash(words[1])))){   
                        erroresArray.push("Error 10 - Manejo de cadenas - Línea " + (i + 1));
                        sintaxisError = true;
                    }else if(words[0]==="extraiga" && !entero.includes(quitarSlash(words[1]))){   
                        erroresArray.push("Error 10 - Manejo de cadenas - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                //si es la instrucción retorne
                }else if((words[0]=="retorne\r" || words[0]=="retorne") && (words.length <= 2)){
                    retorne = true;
                    if (words.length>1 && (words[1].includes(".") || !((Number.isInteger(Number.parseInt(words[1])) && !isNaN(words[1]))))){
                        erroresArray.push("Error 07 - Retorne - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                //si es la instrucción etiqueta
                }else if(words[0]=="etiqueta" && words.length == 3){
                    if (words[1].length < 255 && esLetra(words[1]) && (Number.isInteger(Number.parseInt(words[2])) && !isNaN(words[2])) && (!words[2].includes("."))) {
                        let apuntador = Number.parseInt(words[2]);
                        if (!(words[1] in diccionarioEtiquetas)){ 
                            if (apuntador === (sizeDocumento+1) || apuntador <0) {
                                erroresArray.push("Error 05 - Etiqueta apuntando a instrucción inadecuada");
                                sintaxisError = true;
                            }else if(apuntadorEtiqueta.includes(apuntador)){
                                erroresArray.push("Error 05 - Etiqueta apuntando a instrucción ya apuntada");
                                sintaxisError = true;
                            }else{
                                //asignando dos valores a cada clave, la linea del documento y el valor de la clave
                                diccionarioEtiquetas[words[1]] =[ (sizeDocumento+1), apuntador] ;
                                apuntadorEtiqueta.push(apuntador);
                                lineaEtiqueta.push(sizeDocumento+1);
                            }
                        }else {
                            erroresArray.push("Error 03 - Etiqueta ya declarada - Línea " + (i + 1));
                            sintaxisError = true;
                        }
                    } else {
                        erroresArray.push("Error 01 - Error 06 - Sintaxis - Longitud - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                }else if(words[0]==="vaya" && (words.length==2)){
                    vaya[quitarSlash(words[1])]=sizeDocumento+1;

                }else if(words[0]==="vayasi" && (words.length==3)){
                    vayasi[quitarSlash(words[1])]=[(quitarSlash(words[2])), sizeDocumento+1];
                
                }else if((words[0]==="Y" || words[0]==="O") && (words.length==4)){
                    if(!logicas.includes(quitarSlash(words[1])) || (!logicas.includes(quitarSlash(words[2])) || (!logicas.includes(quitarSlash(words[3]))))){ 
                        erroresArray.push("Error 06 - Variable no declarada - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                }else if(words[0]==="NO" && (words.length==3)){
                    if(!logicas.includes(quitarSlash(words[1])) || (!logicas.includes(quitarSlash(words[2])))){ 
                        erroresArray.push("Error 06 - Variable no declarada - Línea " + (i + 1));
                        sintaxisError = true;
                    }
                }else if(words[0]==="muestre" && (words.length==2)){
                    if(words[1]!="acumulador\r" && !((quitarSlash(words[1])) in diccionarioVariables)){
                    erroresArray.push("Error 01 - Sintaxis - Línea " + (i + 1));
                    sintaxisError = true;
                    }
                }else if(words[0]==="imprima" && (words.length==2)){
                    if(words[1]!="acumulador\r" && !((quitarSlash(words[1])) in diccionarioVariables)){
                    erroresArray.push("Error 01 - Sintaxis - Línea " + (i + 1));
                    sintaxisError = true;
                    }
                }
            }else if (!((retorne==true)  || words[0] == "\r" || words[0] == "\n" || words[0] == "\r\n" || words[0] == "\n\r" || words[0] == "" || (words[0].substring(0, 2) === "//"))) {
                //si la palabra es un salto de linea
                erroresArray.push("Error 01 - Sintaxis - Línea " + (i + 1));
                sintaxisError = true;
                
            }else{
                sizeDocumento--;
            }
            sizeDocumento++;
        }
        //verificar que las etiquetas apunten a una instrucción existente
        Object.entries(diccionarioEtiquetas).forEach(([key, valor]) => {
            if(valor[1]>sizeDocumento){
                erroresArray.push("Error 05 - Posición de etiqueta ("+(key)+")");
                sintaxisError = true;   
            }
        });
        //verificar que las etiquetas no apunten a otra etiqueta 
        if (apuntadorEtiqueta.some((valor=>lineaEtiqueta.includes(valor)))) {
            erroresArray.push("Error 05 - Etiqueta apuntando a otra etiqueta");
            sintaxisError = true;
        }
        //verificar que la etiqueta indicada en la sentencia vaya exista en el diccionario de etiquetas
        Object.entries(vaya).forEach(([key, valor]) => {
            if(!(key in diccionarioEtiquetas)){
                erroresArray.push("Error 05 - Etiqueta no existente - Línea " + (valor));
                sintaxisError = true;
            }
        });
        //verificar que la etiqueta indicada en la sentencia vayasi exista en el diccionario de etiquetas
        Object.entries(vayasi).forEach(([key, valor]) => {
            if(!(key in diccionarioEtiquetas)){
                erroresArray.push("Error 05 - Etiqueta no existente - Línea " + (valor[1]));
                sintaxisError = true;
            }
            if(!(valor[0] in diccionarioEtiquetas)){
                erroresArray.push("Error 05 - Etiqueta no existente - Línea " + (valor[1]));
                sintaxisError = true;
            }
        });
        //mostrar errores en pantalla emergente
        if (sintaxisError) {
            alert("SE ENCONTRARON ERRORES!!!");
            let ventanaErrores = window.open("", "Errores", "width=400,height=200" );
            ventanaErrores.document.write('<h1>' + "ERRORES: " + "<br>" + '</h1>');
            ventanaErrores.document.body.style.backgroundColor = "black";
            ventanaErrores.document.body.style.color = "white";
            // document.getElementById("readFile").insertAdjacentHTML('beforeend', '<p>' + "---------------" + '</p>');
            for (let i = 0; i < erroresArray.length; i++) {
                // document.getElementById("readFile").insertAdjacentHTML('beforeend', '<p>' + erroresArray[i] + '</p>');
                ventanaErrores.document.write('<p>' + erroresArray[i] + "<br>" + '</p>');
            }
        } else {
            asignarMemoria(diccionarioVariables, diccionarioEtiquetas, sizeDocumento);
            
        }
    };
}
//asignar valores a la memoria del sistema 
function asignarMemoria(diccionarioVariables, diccionarioetiquetas, sizeDocumento) {
    //variables
    const variablesProceso = {};
    //etiquetas
    const etiquetasProceso = {};
    //tamaño de memoria disponible para almacenamiento
    let sizeMemmoriaDisponible=(parseInt(sliderM.value)-((parseInt(sliderK.value)))-1);
    //tamaño del archivo contando el espacio requerido para las variables
    let sizeArchivoYVariables = (sizeDocumento + Object.keys(diccionarioVariables).length);
    sizeDocumentos += sizeArchivoYVariables;
    //tamaño de memoria vs instrucciones
    if (sizeDocumentos > sizeMemmoriaDisponible) {
        alert("EL DOCUMENTO ES MUY GRANDE PARA LA MEMORIA!!!");
        //quitar los valores del archivo a la variable de tamaño general 
        sizeDocumentos-=sizeArchivoYVariables;
    }else{
        //desabilitar sliders de rangos
        sliderM.disabled = true;
        sliderK.disabled = true;
        //asignar valores al kernel
        asignado = true;
        if(primerDocumento==true){
            llenarMemoria();
            memoria[0] = acumulador;
            for (let i = 1; i <= parseInt(sliderK.value); i++) {
                memoria[i] = "--CHSOS V2023--";
            }
            primerDocumento=false;
        }
        //leer archivo
        const archivo = new FileReader();
        documento.push(document.getElementById("fileInput").files[0].name);
        //saber la posicion vacia en memoria
        let j = (esVacio());
        //variable para saber la posicion a la que apunta la etiqueta al sumarla con el valor que esté en el diccionario de etiqueta
        let p = j-1 ;
        archivo.readAsText(document.getElementById("fileInput").files[0]);
        archivo.onload = function() {
            //separar por lineas y guardar en un array
            const lines = archivo.result.split('\n');
            for ( i = 0 ; i < lines.length; i++) {
                const line = lines[i];
                const words = line.split(" ");
                //mostrar archivo
                if (words[0] =="retorne"){
                    memoria[j] = line;
                    document.getElementById("readFile").insertAdjacentHTML('beforeend', '<p>'+ (`${j}`.padStart(4, "0"))+" "+ line + '</p>');
                    j++;
                    break; 
                }else if (!(words[0] == "\r" || words[0] == "\n" || words[0] == "\r\n" || words[0] == "\n\r" || words[0] == "" || (words[0].substring(0, 2) === "//"))) {
                    memoria[j] = line;
                    //si la palabra es un salto de linea o comentario
                    document.getElementById("readFile").insertAdjacentHTML('beforeend', '<p>'+ (`${j}`.padStart(4, "0"))+" "+ line + '</p>');
                    j++;
                }
            }
            //mostrar variables en el card           
            Object.entries(diccionarioVariables).forEach(([key, valor]) => {
                memoria[j] = valor;
                variablesProceso[key] = j;
                document.getElementById("readVariables").insertAdjacentHTML('beforeend', '<p>'+ (`${j}`.padStart(4, "0"))+" "+(`${idDocumento}`.padStart(4, "0")) + key + '</p>');
                j++;
            });
            //mostrar etiquetas en el card
            Object.entries(diccionarioetiquetas).forEach(([key, valor]) => {
                // posicion de la etiqueta
                let posicion = p +valor[1]
                etiquetasProceso[key] = posicion;
                document.getElementById("readEtiquetas").insertAdjacentHTML('beforeend', '<p>'+ (`${posicion}`.padStart(4, "0"))+" "+(`${idDocumento}`.padStart(4, "0"))+ key + '</p>');
            });
        }
        //número de documentos leídos
        idDocumento++;
        //guardar en el diccionario de procesos
        diccionarioProcesos[idDocumento] = [variablesProceso, etiquetasProceso];
        index=parseInt(sliderK.value)+1;    
    }
}
//funcion para mostrar la memoria 
function mostrarMemoria() {
    //limpiar memoria
    document.getElementById("readMuestraMemoria").innerHTML = "";
    //validar si la memoria ya fue asignada 
    if (asignado == false){
        memoria.length = 0;
        llenarMemoria();
    }
    //mostrar memoria
    for (let i = 0; i < memoria.length; i++) {
        if(i==0){
            document.getElementById("readMuestraMemoria").insertAdjacentHTML('beforeend', '<p><i class="tiny material-icons">book</i>'+(`${i}`.padStart(4, "0")) +" "+ memoria[i] + '</p>');
        }else if(i<=sliderK.value){
            document.getElementById("readMuestraMemoria").insertAdjacentHTML('beforeend', '<p><i class="tiny material-icons">filter_tilt_shift</i>'+(`${i}`.padStart(4, "0")) +" "+ memoria[i] + '</p>');
        }else{
            document.getElementById("readMuestraMemoria").insertAdjacentHTML('beforeend', '<p><i class="tiny material-icons">memory</i>'+ (`${i}`.padStart(4, "0")) +" "+ memoria[i] + '</p>');
        }
    } 
}
//funcion para llenar la memoria con vacios
function llenarMemoria(){
    for (let i = 0; i < (parseInt(sliderM.value)); i++) {
        memoria[i] ="";
    }
}
//funcion para saber la posicion vacia de la memoria 
function esVacio(){
    let posicionVacia = 0;
    for (let i = 1; i < memoria.length; i++) {
        if (memoria[i] == "") {
            posicionVacia = i;
            break;
        }
    }
    return posicionVacia;
}
//funcion para validar si es una letra
function esLetra(cadena) {
    let primerCaracter = cadena.charAt(0);
    let codigoUnicode = primerCaracter.charCodeAt(0);
    if ((codigoUnicode >= 65 && codigoUnicode <= 90) || (codigoUnicode >= 97 && codigoUnicode <= 122)) {
      return true; // Si el primer carácter es una letra mayúscula o minúscula, devuelve true
    } else {
      return false; // Si el primer carácter no es una letra devuelve false
    }
}
//funcion para quitar el contra slash
function quitarSlash(cadena){
    let cadenaSinSlash = cadena.split("\r");
    return cadenaSinSlash[0];
}
//funcion para ejecutar el programa con intervalos de tiempo o por pasos
function iniciarIntervalo() { 
    if (asignado){
        //cambiar modo del pograma
        document.getElementById("programMode").innerHTML = "Usuario";
        //deshabilitar botón Cargar
        botonCargar.setAttribute("disabled", "true");
        idProceso = 1;
        if(modoPasoAPaso && !(index >= memoria.length || (memoria[index] === "" ))){
            //desabilitar botón Paso a Paso
            botonEjecutarPasoAPaso.setAttribute("disabled", "true");
            //ciclo para recorrer la memoria
            index=ejecutar(index);
            // mostrar instrucción en el card
            index++;
            mostrarMemoria();
            setTimeout(function(){ 
                mostrarVentanaEmergente();
            }, 500);
        }else{
            //desabilitar botón Normal
            botonEjecutarAuto.setAttribute("disabled", "true");
            //empezar despues del espacio asignado para kernel
            intervaloID=setInterval(function(){
                index=ejecutar(index);
                // mostrar instrucción en el card
                index++;
                mostrarMemoria();
                if(index >= memoria.length || (memoria[index] ==="")){
                    detenerIntervalo();
                    botonCargar.removeAttribute("disabled");
                }
            },250);
        }
    }
}
//funcion para mostrar ventana emergente
function mostrarVentanaEmergente(){
    if (confirm("¿Desea continuar en modo paso a paso?")) {
        modoPasoAPaso = true; // activar el modo paso a paso
        botonEjecutarPasoAPaso.removeAttribute("disabled");
        iniciarIntervalo();
    } else {
        modoPasoAPaso = false; // desactivar el modo paso a paso
        botonEjecutarPasoAPaso.removeAttribute("disabled");
        iniciarIntervalo();//
    }
}
//funcion para detener el intervalo de tiempo 
function detenerIntervalo() {
    clearInterval(intervaloID);
    botonEjecutarAuto.removeAttribute("disabled");
    botonEjecutarPasoAPaso.removeAttribute("disabled");
}
//funcion para ejecutar las instrucciones de la memoria
function ejecutar(i){
    //mostrar nombre de programa en el card  
    if(documento.length >= idProceso){
        document.getElementById("programName").innerHTML= documento[idProceso-1];
    }
    try{
        try{
            let line = memoria[i].split(" ");
            if ((line.length >= 2)){
                if (line[0] === "retorne" || line[0] === "retorne\r"){
                    idProceso++;
                    memoria[0] = 0;
                    //salto de linea
                    document.getElementById("screen").innerHTML+= "<br>";
                }
                document.getElementById("instructionLine").innerHTML = (`${i}`.padStart(4, "0")+"-"+ memoria[i]);
                //mostrar acumulador en el card
                document.getElementById("acumuladorValor").innerHTML = memoria[0];
                //ejecutar la instruccion
                i=accion(memoria[i],idProceso,i);
            }else if(line[0]==="retorne" || line[0]==="retorne\r"){
                idProceso++;
                memoria[0] = 0;
                document.getElementById("instructionLine").innerHTML = (`${i}`.padStart(4, "0")+"-"+ memoria[i]);
                //mostrar acumulador en el card
                document.getElementById("acumuladorValor").innerHTML = memoria[0];
                //salto de linea
                document.getElementById("screen").innerHTML+= "<br>";

            }
        }catch(error){
            i=accion(memoria[i],idProceso,i);
        }
    }catch(error){
        console.log("Error en la acción");
    }
    return i;
}
//funcion para ejecutar las acciones de las instrucciones 
function accion(linea, idDocumento,i){
    let variable = "";
    let posicion = 0;
    try{
        let operacion = linea.split(" ");
        variable = quitarSlash(operacion[1]);
        posicion = diccionarioProcesos[idDocumento][0][variable];
    }catch(error){
        return i;
    }
    let operacion = linea.split(" ");
    if (operacion[0]==="cargue"){
        //cargue
        memoria[0] = memoria[posicion];
        return i;
    }else if(operacion[0]==="almacene"){
        //almacene
        memoria[posicion] = memoria[0];
        return i;
    }else if(operacion[0]==="lea"){
        //lea
        memoria[posicion] = prompt("Ingrese un valor");
        return i;
    }else if(operacion[0]==="sume"){
        //sume
        let cadena = memoria[posicion].toString();
        let cadena2 = memoria[0].toString();
        if (cadena.includes(".") || cadena2.includes(".")){
            memoria[0] = parseFloat(memoria[0]) + parseFloat(memoria[posicion]);
        }else{
            memoria[0] = parseInt(memoria[0]) + parseInt(memoria[posicion]);
        }
        return i;
    }else if(operacion[0]==="reste"){
        //reste
        let cadena = memoria[posicion].toString();
        let cadena2 = memoria[0].toString();
        if (cadena.includes(".") || cadena2.includes(".")){
            memoria[0] = parseFloat(memoria[0]) - parseFloat(memoria[posicion]);
        }else{
            memoria[0] = parseInt(memoria[0]) - parseInt(memoria[posicion]);
        }
        return i;
    }else if(operacion[0]==="multiplique"){
        //multiplique
        let cadena = memoria[posicion].toString();
        let cadena2 = memoria[0].toString();
        if (cadena.includes(".") || cadena2.includes(".")){
            memoria[0] = parseFloat(memoria[0]) * parseFloat(memoria[posicion]);
        }else{
            memoria[0] = parseInt(memoria[0]) * parseInt(memoria[posicion]);
        }
        return i;
    }else if(operacion[0]==="divida"){
        //divida
        //validar que no se divida entre 0
        try {
            if(memoria[posicion]!= 0){
                let cadena = memoria[posicion].toString();
                let cadena2 = memoria[0].toString();
                if (cadena.includes(".") || cadena2.includes(".")){
                    memoria[0] = parseFloat(memoria[0]) / parseFloat(memoria[posicion]);
                }else{
                    memoria[0] = parseInt(memoria[0]) / parseInt(memoria[posicion]);
                }
            }
        } catch (error) {
            console.log("No se puede dividir entre 0");   
        }
        return i;
    }else if(operacion[0]==="potencia"){
        //potencia
        memoria[0] = Math.pow(memoria[0],memoria[posicion]);
        return i;
    }else if(operacion[0]==="modulo"){
        //modulo
        memoria[0] = parseInt(memoria[0]) % parseInt(memoria[posicion]);
        return i;
    }else if(operacion[0]==="concatene"){
        //concatene
        memoria[0] = memoria[0] + memoria[posicion];
        return i;
    }else if(operacion[0]==="elimine"){
        //elimine
        memoria[0] = memoria[0].replaceAll(memoria[posicion],"");
        return i;
    }else if(operacion[0] === "extraiga"){
        //extraiga
        let extraer = memoria[diccionarioProcesos[idDocumento][0][variable]];
        let subcadena = memoria[0].substring(0,extraer);
        memoria[0] = subcadena;
        return i;
    }else if (operacion[0]==="muestre"){
        //muestre
        if (operacion[1]==="acumulador\r"){
            document.getElementById("screen").insertAdjacentHTML("beforeend",memoria[0]);
            //salto de liena
            document.getElementById("screen").innerHTML += "<br>";
        }else{
            document.getElementById("screen").insertAdjacentHTML('beforeend', memoria[posicion]);
            //salto de liena
            document.getElementById("screen").innerHTML += "<br>";
        }
        return i;
    }else if (operacion[0]==="imprima"){
        //imprima
        if(operacion[1]==="acumulador\r"){
            document.getElementById("print").insertAdjacentHTML("beforeend",memoria[0]);
            //salto de liena
            document.getElementById("screen").innerHTML += "<br>";
        }else{
            document.getElementById("print").insertAdjacentHTML('beforeend', memoria[posicion]);
            //salto de liena
            document.getElementById("screen").innerHTML += "<br>";
        }
        return i;
    }else if(operacion[0]==="vaya"){
        //vaya
        let posicion = diccionarioProcesos[idDocumento][1][variable];
        i=posicion;
        return i;
    }else if(operacion[0]==="vayasi"){
        //vayasi
        if(memoria[0] < 0){
            let posicion = diccionarioProcesos[idDocumento][1][quitarSlash(operacion[2])];
            console.log(posicion);
            i=posicion-1;
            return i;
        }else if(memoria[0] > 0){
            let posicion = diccionarioProcesos[idDocumento][1][operacion[1]];
            i=posicion-1;
            return i;
        }
        return i;
    }else if(operacion[0]==="Y"){
        //Y
        let variable1 = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[1])];
        let variable2 = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[2])];
        let result = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[3])];
        if(memoria[variable1] && memoria[variable2]){
            memoria[result] = 1;
        }else{
            memoria[result] = 0;
        }
        return i;
    }else if(operacion[0]==="O"){
        //O
        let variable1 = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[1])];
        let variable2 = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[2])];
        let result = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[3])];
        if(memoria[variable1] || memoria[variable2]){
            memoria[result] = 1;
        }else{
            memoria[result] = 0;
        }
        return i;
    }else if(operacion[0]==="NO"){
        //NO
        let variable1 = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[1])];
        let result = diccionarioProcesos[idDocumento][0][quitarSlash(operacion[2])];
        if(memoria[variable1]){
            memoria[result] = 0;
        }else{
            memoria[result] = 1;
        }
        return i;
    }else if(operacion[0]==="reinicio"){
        //reinicio de variable
        if(isNaN(memoria[posicion])){
            memoria[posicion]="";
        }else{
            memoria[posicion]=0;
        }
        return i;
    }else{
        return i;
    }
}
//función para cargar el archivo a editar
document.getElementById("fileEditor").addEventListener("change", function(){
    let file = document.getElementById("fileEditor").files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(){
        document.getElementById("editorFile").value = reader.result;
    }
});
//funcion para guardar el archivo hecho 
function guardarFile() {
    // Obtener el contenido del textarea
    const texto = document.getElementById('editorFile').value;
    // Crear un objeto Blob con el contenido del textarea
    const blob = new Blob([texto], { type: 'text/plain' });
    // Crear un objeto URL para el blob
    const url = URL.createObjectURL(blob);
    // Crear un enlace para descargar el archivo
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'nuevo-programa.CH';
    // Simular un click en el enlace para descargar el archivo
    enlace.click();
    // Liberar el objeto URL
    URL.revokeObjectURL(url);
}

  