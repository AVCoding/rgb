
// async function enumDevices() {
//   let result = [];
//   const devices = await navigator.mediaDevices.enumerateDevices();
//   for (let i in devices) {
//     let device = devices[i];
//     if (device.kind === "videoinput") {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: { groupId: device.groupId } });
//         const track = await stream.getTracks()[0];
//         const caps = await track.getCapabilities();
//         if (caps.facingMode.indexOf("user") === -1) {
//           let label = device.label != "" ? device.label : "Camera " + i;
//           result.push({ label: label, deviceId: caps.deviceId });
//         }
//         stream.getTracks().forEach(track => track.stop());
//       } catch (e) {}
//     }
//   }
//   return result;
// }


class Streamer {

  cameraId;
  capturer;
  stream;

  constructor(id) {
    this.cameraId = id;
    this.Run();
  }


  async Run() {
    while (true) {
      let videoRatio = 1;
      const video = document.getElementById("video");
      let stream = null;
      window.dispatcher.Status();

      try {
        let constraints = { video: { facingMode: "environment" } };
        if (this.cameraId) constraints = { video: { deviceId: { exact: this.cameraId } } };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.stream = stream;

        let track = stream.getVideoTracks()[0];

        constraints = track.getConstraints();
        //constraints.height = 1080;

        let caps = track.getCapabilities();
        if (caps.height.max) {
        // if (caps.height && "max" in caps.height) {
          //constraints.height = caps.height.max / 4;
          constraints.height = caps.height.max;
        }
        await track.applyConstraints([constraints]);

        const renderer = new ImageCapture(track);
        const bitmap = await renderer.grabFrame();
        videoRatio = bitmap.width / bitmap.height;
        bitmap.close();

      } catch (e) {
        $("#error").text("Видеозахват не поддерживается");
        break;
      }

      function resize() {
        window.resized = true;
        let
          windowWidth = $(video).parent().width(),
          windowHeight = $(video).parent().height();

        if ((windowWidth / windowHeight) > videoRatio) {
          video.width = windowWidth;
          video.height = windowWidth / videoRatio;
        } else {
          video.height = windowHeight;
          video.width = windowHeight * videoRatio;
        }
      }
      $(window).resize(resize).trigger("resize");

      if (stream) {
        video.srcObject = stream;
        const that = this;
        video.onloadedmetadata = function () {
          video.play();
          that.capturer = new Capturer().Run();
        };
      } else {
        $("#error").text("Видеозахват не поддерживается");
      }

      break;
    }
  }

  Stop() {
    if (this.capturer) this.capturer.Stop();
    if (this.stream) {
      const video = document.getElementById("video");
      video.pause();
      video.srcObject = undefined;

      this.stream.getVideoTracks().forEach(t => t.stop());
      this.stream = undefined;
    }
  }
}

class Capturer {
  active = true;
  timeout = null;

  Run() {
    let that = this;
    let iteration = 0;
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const renderer = new ImageCapture(video.srcObject.getVideoTracks()[0]);
    let frameRect = {};

    //if (!window.dispatcher) window.dispatcher = new Dispatcher();

    function resize() {
      window.resized = false;
      let $vr = $(video), $cr = $(canvas);
      let vo = $vr.offset(), co = $cr.offset();
      frameRect.left = (co.left - vo.left) / $vr.width();
      frameRect.top = (co.top - vo.top) / $vr.height();
      frameRect.right = (co.left + $cr.width() - vo.left) / $vr.width();
      frameRect.bottom = (co.top + $cr.height() - vo.top) / $vr.height();
    }

    function Dispatch(barcode) {


    }
    
    async function decode(canvas) {
      let result = null;
      let barcode = null;

      ////////// Filter part
      // var imageData;
      // var contextFilter = canvas.getContext('2d');
      // imageData = contextFilter.getImageData(0, 0, canvas.width, canvas.height);
      // for (var i = 0; i < imageData.data.length; i += 4) {
      //   //Brown Filter
      //   if (data[i] > 125 ) {
      //      data[i] = 255;
      //      data[i + 1] = 255;
      //      data[i + 2] = 255;
      //   }
      // }


      /////////////////////////////////////

      while (true) {
        ////////// Filter part

        try {

          var imageData;
          var contextFilter = canvas.getContext('2d');
          imageData = contextFilter.getImageData(0, 0, canvas.width, canvas.height);
          for (var i = 0; i < imageData.data.length; i += 4) {
            //Brown Filter
            if (imageData.data[i] > 125 ) {
                if (imageData.data[i] < 100) {
                    imageData.data[i] = 255;
                    imageData.data[i + 1] = 255;
                    imageData.data[i + 2] = 255;
                }

                if (imageData.data[i] != 255) {
                    imageData.data[i] = 0;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 0; 
                }
                else {
                    imageData.data[i] = 255;
                    imageData.data[i + 1] = 255;
                    imageData.data[i + 2] = 255;
                }

                if (imageData.data[i] == 255) {
                    imageData.data[i] = 0;
                    imageData.data[i + 1] = 0;
                    imageData.data[i + 2] = 0;
                }
                else {
                    imageData.data[i] = 255;
                    imageData.data[i + 1] = 255;
                    imageData.data[i + 2] = 255;
                }
            }
          }

          
          const barcodeDetector = new BarcodeDetector();
          const barcodes = await barcodeDetector.detect(imageData.data);
          if (barcodes && barcodes.length) {
            barcode = barcodes[0];
            result = {
              rawValue: barcode.rawValue.replace(/[^%\d]/g, ''),
              boundingBox: barcode.boundingBox,
              alg: "embedded"
            }
          }
        } catch (e) {
          console.log(e);
        } 
        if (result) break;

        /////////////////////////////////////

//         try {
//           const barcodeDetector = new BarcodeDetector();
//           const barcodes = await barcodeDetector.detect(canvas);
//           if (barcodes && barcodes.length) {
//             barcode = barcodes[0];
//             result = {
//               rawValue: barcode.rawValue.replace(/[^%\d]/g, ''),
//               boundingBox: barcode.boundingBox,
//               alg: "embedded"
//             }
//           }
//         } catch (e) {} 

//        if (result) break;

        const codeReader = new ZXing.BrowserMultiFormatReader();
        try {
          const image = new Image();
          image.src = canvas.toDataURL();
          barcode = await codeReader.decodeFromImageElement(image);
          image.src = undefined;
        } catch (e) {
          //console.log(e);
        }

        if (barcode && barcode.text) {
          result = {
            rawValue: barcode.text,
            alg: "zxing"
          }
          if (barcode.resultPoints && (barcode.resultPoints.length == 2)) {
            result.boundingBox = {
              x: barcode.resultPoints[0].x,
              y: barcode.resultPoints[0].y,
              width: barcode.resultPoints[1].x - barcode.resultPoints[0].x,
              height: barcode.resultPoints[1].y - barcode.resultPoints[0].y
            }
          }
        }

        break;
      }

      return result;
    }

    async function capture() {
      iteration++;
      if (window.resized) resize();
      if (!that.active) return;

      $("#debug").text(iteration); 

      try {
        let bitmap = await renderer.grabFrame();

        const bCanvas = document.createElement("canvas");
        bCanvas.width = bitmap.width * (frameRect.right - frameRect.left);
        bCanvas.height = bitmap.height * (frameRect.bottom - frameRect.top);
        bCanvas.getContext("2d").drawImage(bitmap, bitmap.width * frameRect.left, bitmap.height * frameRect.top, bitmap.width * (frameRect.right - frameRect.left), bitmap.height * (frameRect.bottom - frameRect.top), 0, 0, bCanvas.width, bCanvas.height);



        let barcode = await decode(bCanvas); //bitmap

        //alert(JSON.stringify(barcode));

        if (barcode) {
          if (barcode.rawValue) {
            $("#debug").text(iteration + ": " + barcode.rawValue);

            let result = await dispatcher.Add(barcode.rawValue);
            let success = (result != "repetion");

            if (result == "checked") try { navigator.vibrate([50]); } catch (e) { }
            if (result == "multiple") try { navigator.vibrate([20, 50, 20, 50, 20]); } catch (e) { }
            //if ((result == "error") || (result == "repetion")) try { navigator.vibrate([20, 50, 20, 50, 20, 50, 20, 50, 20]); } catch (e) { }
            if (result == "error") try { navigator.vibrate([20, 50, 20, 50, 20, 50, 20, 50, 20]); } catch (e) { }

            if (success) {
              dispatcher.SetSign(result);
              context.drawImage(bCanvas, 0, 0, canvas.width, canvas.height);

              if (barcode.boundingBox) {
                context.beginPath();
                context.lineWidth = "14";
                context.strokeStyle = "green";
                if (barcode.alg == "zxing") context.strokeStyle = "blue";
                context.moveTo(barcode.boundingBox.x / bCanvas.width * canvas.width, (barcode.boundingBox.y + barcode.boundingBox.height / 2) / bCanvas.height * canvas.height);
                context.lineTo((barcode.boundingBox.x + barcode.boundingBox.width) / bCanvas.width * canvas.width, (barcode.boundingBox.y + barcode.boundingBox.height / 2) / bCanvas.height * canvas.height);
                context.stroke();
              }

              //$("#debug").text(iteration);
              await new Promise(resolve => setTimeout(resolve, 500));
              context.clearRect(0, 0, canvas.width, canvas.height);

              dispatcher.SetSign();
              dispatcher.Status();
            }
          }
        }

        bCanvas.remove();
        bitmap.close();

        bCanvas = undefined;
        bitmap = undefined;
      } catch (e) { } 

      if (that.active) that.timeout = window.setTimeout(await capture, 400);
    }

    resize();
    capture();

    return this;
  }

  Stop() {
    window.clearTimeout(this.timeout);
    this.active = false;
    dispatcher.Reset();
  }
}

class Dispatcher {
  //barcodes = [];
  lastOrder;
  lastBarcode; 
  mode;
  date;

  signs = {
    "error": '<i class="fas fa-times" style="color: red;"></i>',
    "repetion": '<i class="fas fa-exclamation" style="color: #ffd600;"></i>',
    "multiple": '<i class="fas fa-exclamation" style="color: #ffd600;"></i>',
    "checked": '<i class="fas fa-check" style="color: #02ad1f;"></i>',
    "default": '<i class="fas fa-barcode"></i>'
  };

  SetMode(mode) {
    this.mode = mode;
    this.Load(mode);
  }

  SetDate(date) {
    this.date = date;
  }

  Status() {
    $(".status").text($(".checked, .multiple").length + "/" + $("td.state").length);
  }

  SetSign(sign) {
    if (!sign) sign = "default";
    $("#warning-sign").html(this.signs[sign]);
  }

  Reset() {
    this.lastOrder = undefined;
    this.lastBarcode = undefined;
  }

  async Load(mode, date, reload) {
    if (!reload) {
      this.Reset();
      $("#content").html('<div class="fa-3x d-flex align-items-center justify-content-center" style="height: 6rem; color: #aaa;"><i class="fas fa-cog fa-spin"></i></div>')
      if (date) {
        date = 'date="' + date + '" ';
      } else {
        date = "";
      } 
    }

    let data = '<parameters operation="' + mode + '" ' + date + '/>'; 
    let response = await fetch("content.ashx?mode=query&type=barcode", { method: "POST", body: data });
    let html = await response.text();
    
    if (html.indexOf("Доступ запрещен") !== -1) {
      if (!reload) {
        await fetch("/handlers/set-context.ashx?simple-auth=true&update-session=true", { method: "GET" });
        await this.Load(mode, date, true);
      } else {
        $("#content").html(html);
      }
    } else {
      $("#content").html(html);
    }
  }

  async Clear(mode, date, reload) {
    let response = await fetch("content.ashx?mode=delete&type=barcode", { method: "POST", body: '<parameters operation="' + mode + '" date="' + date + '"/>' });
    if (reload) return;

    let text = await response.text();
    if (text.indexOf("Доступ запрещен") !== -1) {
      await fetch("/handlers/set-context.ashx?simple-auth=true&update-session=true", { method: "GET" });
      await this.Clear(mode, date, true);
    }
  }

  async Dispatch(order) {
    let counter = 0;
    while (true) {
      let response = await fetch("content.ashx?mode=save&type=barcode", { method: "POST", body: '<package operation="' + this.mode + '" date="' + this.date + '"><order id="' + order + '"/></package>' });
      if (counter > 0) break;
      let text = await response.text();
      if (text.indexOf("Доступ запрещен") !== -1) {
        await fetch("/handlers/set-context.ashx?simple-auth=true&update-session=true", { method: "GET" });
        counter++;
        continue;
      }
      break;
    }
  }

  async Add(barcode) {
    let result = "error";
    barcode = barcode.split("%").slice(-1)[0];
    
    let order;
    let $state;
    let repetion = (barcode == this.lastBarcode);

    while (true) {
      if (repetion) break;

      let $order = $("tr[data-bc1='" + barcode + "'], tr[data-bc2='" + barcode + "']");
      if ($order.length == 0) break;

      order = $order.attr("data-order-id");
      if (!order) break;

      repetion = (order == this.lastOrder);
      if (repetion) break;

      $state = $order.find(".state.checked, .state.multiple");
      if ($state.length > 0) {
        result = "multiple";
        break;
      }

      $state = $order.find(".state.unknown");
      if ($state.length == 1) {
        result = "checked";
      }
      
      break;
    }

    if (repetion) {
      result = "repetion";
    } else {
      if (order) this.Dispatch(order);

      if ($state && ($state.length > 0)) {
        $state.removeAttr("class").addClass("state").addClass(result);
      }

      this.lastOrder = order;
      this.lastBarcode = barcode;
    }

    return result;
  }
}
