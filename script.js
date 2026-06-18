function calcular() {
        let test = parseFloat(document.getElementById("test").value)
        let certamen = parseFloat(document.getElementById("certamen").value)
        let examen = parseFloat(document.getElementById("examen").value)

        let nota_parcial = test * 0.30 + certamen * 0.70
        let nota_final = nota_parcial * 0.50 + examen * 0.50
        let examenFalta = isNaN(examen)
        let notaNecesaria = 8.0 - nota_parcial
        
        // Parar ambos audios
        const audioTriste = document.getElementById("audioTriste")
        const audioFeliz = document.getElementById("audioFeliz")
        audioTriste.pause()
        audioFeliz.pause()
        audioTriste.currentTime = 0
        audioFeliz.currentTime = 0
        
        // Determinar fondo y audio (la nota final prima)
        let fondoClass = "fondodefault"
        if (!examenFalta) {
          if (nota_final >= 4.0) {
            fondoClass = "fondobueno"
            document.getElementById("resultado").style.color = "green"
            document.getElementById("nubes").style.display = "none"
            audioFeliz.play()
          } else {
            fondoClass = "fondomalo"
            document.getElementById("resultado").style.color = "red"
            document.getElementById("nubes").style.display = "block"
            audioTriste.play()
          }
        } else {
          // examen faltante: usar nota parcial
          if (nota_parcial >= 4.0) {
            fondoClass = "fondobueno"
            document.getElementById("resultado").style.color = "green"
            document.getElementById("nubes").style.display = "none"
            audioFeliz.play()
          } else {
            fondoClass = "fondomalo"
            document.getElementById("resultado").style.color = "red"
            document.getElementById("nubes").style.display = "block"
            audioTriste.play()
          }
        }

        // Aplicar clase de fondo al body
        document.body.className = fondoClass

        // Solo color para la nota parcial (sin audio, la nota final ya primó)
        if (nota_parcial >= 4.0) {
          document.getElementById("resultado nota de presentación").style.color = "green"
        } else {
          document.getElementById("resultado nota de presentación").style.color = "red"
        }

        if (examenFalta) {
          document.getElementById("resultado").innerText = "Debes sacarte un " + notaNecesaria.toFixed(1) + " en el examen para pasar"
        } else {
          document.getElementById("resultado").innerText = "Nota final: " + nota_final.toFixed(1)
        }
        document.getElementById("resultado nota de presentación").innerText = "Nota de presentación: " + nota_parcial.toFixed(1)
      }

