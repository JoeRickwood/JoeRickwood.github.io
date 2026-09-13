
  const canvas = document.getElementById("canvas");

  const gl = canvas.getContext("webgl");

  if (!gl) {
      document.body.innerHTML =
          "<h1 style='color:white'>WebGL is not supported.</h1>";
  }


  /* =========================================================
    VERTEX SHADER
    ========================================================= */

  const vertexShaderSource = `
  attribute vec2 position;

  varying vec2 uv;

  void main()
  {
      uv = position * 0.5 + 0.5;

      gl_Position = vec4(position, 0.0, 1.0);
  }
  `;


  /* =========================================================
    FRAGMENT SHADER
    ========================================================= */

  const fragmentShaderSource = `

  precision highp float;

  varying vec2 uv;

  uniform float time;
  uniform vec2 resolution;
  uniform sampler2D noiseTexture;


  /* =========================================================
    NOISE
    ========================================================= */

  vec2 getNoiseFlow(vec2 p)
  {
      float x = texture2D(
          noiseTexture,
          fract(p)
      ).r;

      float y = texture2D(
          noiseTexture,
          fract(p + vec2(0.31, 0.73))
      ).r;

      return vec2(x, y) - 0.5;
  }


  /* =========================================================
    MAIN
    ========================================================= */

  void main()
  {
      /*
          Coordinates
      */

      vec2 p = uv - 0.5;

      float aspect =
          resolution.x / resolution.y;

      p.x *= aspect;


      /*
          These are basically your original values.
      */

      float Zoom = 0.4;

      float Tile = 0.85;

      float Formuparam = 0.53;

      float DarkMatter = 0.9;

      float Distfading = 0.73;

      float Saturation = 0.85;


      /*
          IMPORTANT:

          Your original Brightness was 0.0015.

          We're starting at 0.015 here because we're going
          to accumulate the actual fractal brightness directly.
      */

      float Brightness = 0.015;


      /*
          Camera direction.
      */

      vec3 dir =
          vec3(
              p * Zoom,
              1.0
          );


      /*
          Slow movement.

          Your original Speed was 0.0001, which is almost
          imperceptible. This is still slow, but visible.
      */

      float t =
          time * 0.0003 +
          0.25;


      /*
          Volumetric state.
      */

      float s = 0.1;

      float fade = 1.0;

      vec3 col = vec3(0.0);


      /* =====================================================
        VOLUME
        ===================================================== */

      for (int r = 0; r < 20; r++)
      {

          /*
              Your original ray position.
          */

          vec3 q =
              vec3(
                  t * 2.0,
                  t,
                  -2.0
              )
              +
              s * dir * 0.5;


          /*
              Your original tile fold.
          */

          q =
              abs(
                  vec3(Tile) -
                  mod(
                      q,
                      vec3(Tile * 2.0)
                  )
              );

          /* =================================================
            YOUR FRACTAL
            ================================================= */

          float pa = 0.0;

          float a = 0.0;


          for (int i = 0; i < 17; i++)
          {
              /*
                  SAFETY FIX:

                  The original:

                      p = abs(p) / dot(p,p) - Formuparam

                  can divide by zero.

                  This tiny epsilon prevents NaNs.
              */

              float denominator =
                  max(
                      dot(q, q),
                      0.00001
                  );


              q =
                  abs(q) /
                  denominator -
                  Formuparam;


              float currentLength =
                  length(q);


              a +=
                  abs(
                      currentLength -
                      pa
                  );


              pa =
                  currentLength;
          }


          /* =================================================
            DARK MATTER
            ================================================= */

          float dm =
              max(
                  0.0,
                  DarkMatter -
                  a * a * 0.001
              );


          a *= a * a;


          if (r > 6)
          {
              fade *=
                  1.0 - dm;
          }


          /* =================================================
            COLOR
            ================================================= */

          float colorPosition =
              (
                  sin(
                      length(q) * 0.5
                  )
                  + 1.0
              )
              * 0.5;


          float mixAmount =
              smoothstep(
                  0.0,
                  0.82,
                  colorPosition
              );


          float mixAmount2 =
              smoothstep(
                  0.82,
                  0.96,
                  colorPosition
              );


          vec3 CloudColor =
              vec3(
                  0.2,
                  0.15,
                  0.8
              );


          vec3 CloudColor2 =
              vec3(
                  0.9,
                  0.15,
                  0.8
              );


          vec3 CloudColor3 =
              vec3(
                  1.0,
                  0.15,
                  0.55
              );


          vec3 hueColor =
              mix(
                  CloudColor,
                  CloudColor2,
                  mixAmount
              );


          hueColor =
              mix(
                  hueColor,
                  CloudColor3,
                  mixAmount2
              );


          /* =================================================
            ACCUMULATION

            This is intentionally close to your original.
          ================================================= */

          col +=
              vec3(fade);


          col +=
              hueColor *
              a *
              Brightness *
              fade;


          fade *=
              Distfading;


          s +=
              0.1;
      }


      /* =====================================================
        SATURATION
        ===================================================== */

      float luminance =
          dot(
              col,
              vec3(
                  0.299,
                  0.587,
                  0.114
              )
          );


      col =
          mix(
              vec3(luminance),
              col,
              Saturation
          );


      /*
          The original shader divides by 100.
      */

      float levels = 8.0;
      col /= 2048.0;


      col =
          1.0 -
          exp(
              -col * 2.5
          );

      col = col * vec3(0.2, 0.5, 1);

      col =
          pow(
              max(col, 0.0),
              vec3(0.85)
          );

              col =
          floor(
              col * levels
          ) / levels;

          
      gl_FragColor =
          vec4(col, 1.0);
  }

  `;


  /* =========================================================
    SHADER COMPILATION
    ========================================================= */

  function compile(type, source)
  {
      const shader =
          gl.createShader(type);

      gl.shaderSource(
          shader,
          source
      );

      gl.compileShader(shader);

      if (!gl.getShaderParameter(
          shader,
          gl.COMPILE_STATUS
      ))
      {
          console.error(
              gl.getShaderInfoLog(shader)
          );

          throw new Error(
              gl.getShaderInfoLog(shader)
          );
      }

      return shader;
  }


  const vertexShader =
      compile(
          gl.VERTEX_SHADER,
          vertexShaderSource
      );


  const fragmentShader =
      compile(
          gl.FRAGMENT_SHADER,
          fragmentShaderSource
      );


  const program =
      gl.createProgram();


  gl.attachShader(
      program,
      vertexShader
  );


  gl.attachShader(
      program,
      fragmentShader
  );


  gl.linkProgram(
      program
  );


  if (!gl.getProgramParameter(
      program,
      gl.LINK_STATUS
  ))
  {
      console.error(
          gl.getProgramInfoLog(program)
      );
  }


  gl.useProgram(program);


  /* =========================================================
    FULLSCREEN TRIANGLE
    ========================================================= */

  const buffer =
      gl.createBuffer();


  gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
  );


  gl.bufferData(
      gl.ARRAY_BUFFER,

      new Float32Array([
          -1, -1,
          3, -1,
          -1,  3
      ]),

      gl.STATIC_DRAW
  );


  const position =
      gl.getAttribLocation(
          program,
          "position"
      );


  gl.enableVertexAttribArray(
      position
  );


  gl.vertexAttribPointer(
      position,
      2,
      gl.FLOAT,
      false,
      0,
      0
  );


  /* =========================================================
    UNIFORMS
    ========================================================= */

  const timeLocation =
      gl.getUniformLocation(
          program,
          "time"
      );


  const resolutionLocation =
      gl.getUniformLocation(
          program,
          "resolution"
      );


  const noiseLocation =
      gl.getUniformLocation(
          program,
          "noiseTexture"
      );


  /* =========================================================
    NOISE TEXTURE
    ========================================================= */

  const texture =
      gl.createTexture();


  const image =
      new Image();


  image.onload = function()
  {
      gl.bindTexture(
          gl.TEXTURE_2D,
          texture
      );


      gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
      );


      /*
          CLAMP_TO_EDGE is important here.

          WebGL1 does not allow REPEAT on arbitrary
          non-power-of-two textures.
      */

      gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_WRAP_S,
          gl.CLAMP_TO_EDGE
      );


      gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_WRAP_T,
          gl.CLAMP_TO_EDGE
      );


      gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR
      );


      gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER,
          gl.LINEAR
      );


      requestAnimationFrame(render);
  };


  image.onerror = function()
  {
      console.error(
          "FAILED TO LOAD noise.png"
      );
  };


  image.src = "./noise.png";


  /* =========================================================
    RESIZE
    ========================================================= */

  function resize()
  {
      const dpr =
          Math.min(
              window.devicePixelRatio || 1,
              2
          );


      canvas.width =
          Math.floor(
              window.innerWidth * dpr
          );


      canvas.height =
          Math.floor(
              window.innerHeight * dpr
          );


      gl.viewport(
          0,
          0,
          canvas.width,
          canvas.height
      );
  }


  window.addEventListener(
      "resize",
      resize
  );


  resize();


  /* =========================================================
    RENDER
    ========================================================= */

  const start =
      performance.now();


  function render(now)
  {
      const elapsed =
          (now - start) / 1000;


      gl.clearColor(
          0.01,
          0.0,
          0.02,
          1.0
      );


      gl.clear(
          gl.COLOR_BUFFER_BIT
      );


      gl.uniform1f(
          timeLocation,
          elapsed
      );


      gl.uniform2f(
          resolutionLocation,
          canvas.width,
          canvas.height
      );


      gl.activeTexture(
          gl.TEXTURE0
      );


      gl.bindTexture(
          gl.TEXTURE_2D,
          texture
      );


      gl.uniform1i(
          noiseLocation,
          0
      );


      gl.drawArrays(
          gl.TRIANGLES,
          0,
          3
      );


      requestAnimationFrame(render);
  }
