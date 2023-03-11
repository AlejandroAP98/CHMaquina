M.AutoInit();

//lista de nemónicos para el procesador
var lista= ["cargue","almacene","nueva","lea","sume","reste","multiplique","divida","potencia","modulo","concatene","elimine","extraiga","Y","O","NO","muestre","imprima","retorne\r","retorne","vaya","vayasi","etiqueta"];
var memoria = new Array ();
var asignado=false;
var sizeDocumentos=0;
var primerDocumento = true;
var acumulador = 0;
var idDocumento = 0;

//Rango de memoria y valor actual
const sliderM = document.getElementById("memoryRange");
const valorM = document.getElementById("memoryValor");
//Rango de kernel y valor actual
const sliderK = document.getElementById("kernelRange");
const valorK = document.getElementById("kernelValor");


// Lee el archivo y lo imprime en consola cuando se presiona el boton procesar 
document.getElementById("fileInput").addEventListener("change", function() {
    var archivo = new FileReader();
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
    archivo.readAsText(document.getElementById("fileInput").files[0]);
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
                                }
                            } else if (words[2] === "R") {
                                if (!(!isNaN(Number.parseFloat(words[3])) && !isNaN(words[3]))) {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;
                                }
                            } else if (words[2] === "L") {
                                if (words[3] === "1\r" || words[3] === "0\r") {
                                    logicas.push(words[1]);
                                } else {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;
                                }
                            }else if (words[2] === "C") {
                                if (words[3].length >=0) {
                                    erroresArray.push("Error 02 - Tipo de valor - Línea " + (i + 1));
                                    sintaxisError = true;
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
                //si se está asignando una instrucción a una variable existente
                } else if ((words[0] == "cargue" || words[0] == "lea" || words[0] == "sume" || words[0] == "reste" || words[0] == "multiplique" || words[0] == "divida" || words[0] == "potencia" || words[0] == "modulo" || words[0] == "concatene" || words[0] == "elimine" || words[0] == "extraiga" || words[0] == "muestre" || words[0] == "imprima") && (words.length == 2) ) {
                    if (!((quitarSlash(words[1])) in diccionarioVariables)) {
                        erroresArray.push("Error 06 - Variable no declarada - Línea " + (i + 1));
                        sintaxisError = true;
                    } else if (words[0] === "divida" && diccionarioVariables[quitarSlash(words[1])] === "0") {
                        erroresArray.push("Error 04 - División por cero - Línea " + (i + 1));
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
                }else{
                    erroresArray.push("Error 01 - Sintaxis - Línea " + (i + 1));
                    sintaxisError = true;
                }
            }else if (!((retorne==true)  || words[0] == "\r" || words[0] == "\n" || words[0] == "\r\n" || words[0] == "\n\r" || words[0] == "" || (words[0].substring(0, 2) === "//"))) {
                //si la palabra es un salto de linea
                erroresArray.push("Error de sintaxis en la línea - " + (i + 1));
                sintaxisError = true;
                
            }else{
                sizeDocumento--;
            }
            sizeDocumento++;
        }
        //verificar que las etiquetas apunten a una instrucción existente
        Object.entries(diccionarioEtiquetas).forEach(([key, valor]) => {
            if(valor[1]>=sizeDocumento){
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
   
});



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
//asignar valores a la memoria del sistema 
function asignarMemoria(diccionarioVariables, diccionarioetiquetas, sizeDocumento) {
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
        console.log(document.getElementById("fileInput").files[0].name);
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
                //posicion de la variable 
                memoria[j] = valor;
                document.getElementById("readVariables").insertAdjacentHTML('beforeend', '<p>'+ (`${j}`.padStart(4, "0"))+" "+(`${idDocumento}`.padStart(4, "0")) + key + '</p>');
                j++;
            });
            //mostrar etiquetas en el card
            Object.entries(diccionarioetiquetas).forEach(([key, valor]) => {
                // posicion de la etiqueta
                let posicion = p +valor[1]
                document.getElementById("readEtiquetas").insertAdjacentHTML('beforeend', '<p>'+ (`${posicion}`.padStart(4, "0"))+" "+(`${idDocumento}`.padStart(4, "0"))+ key + '</p>');
            });

        }
        //número de documentos leídos
        idDocumento++;
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
        memoria[i] = "";
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
