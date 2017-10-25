encapsulate a glsl shader program

represents a shaderprogram in WebGL

### vertexShader

the vertex shader for this program

### fragmentShader

the fragment shader for this program

### geometrySshader

the geometry shader for this program

### compiled

flag for if this program is compiled

### md5hash

the md5 hash of this program


  /** Options for attribute normalization. */
  enum NormalizeOption {
    /// The values range across the limits of the numeric type.
    /// This option instructs the rendering engine to normalize them to
    /// the range [0.0, 1.0] for unsigned types, and [-1.0, 1.0] for signed
    /// types.
    /// For example, unsigned char values will be mapped so that 0 = 0.0,
    /// and 255 = 1.0.
    /// The resulting floating point numbers will be passed into
    /// the shader program.
    Normalize,
    /// The values should be used as-is. Do not perform any normalization.
    NoNormalize
  };

### isBound()

Check if the program is currently bound, or not.

### releaseGraphicsResources(win)

release  any graphics  resources being used

### handle

the handle of the shader program.

###  error

the error message (empty if none) for the shader program.

### enableAttributeArray(name)

Enable the named attribute array. Return false if the attribute array is
not contained in the linked shader program.

### disableAttributeArray(name)

Disable the named attribute array. Return false if the attribute array is
not contained in the linked shader program.

### useAttributeArray(name, offset, stride,
                      elementType, elementTupleSize,
                      normalize);

Use the named attribute array with the bound BufferObject.
- name of the attribute (as seen in the shader program).
- offset into the bound BufferObject.
- stride The stride of the element access (i.e. the size of each
  element in the currently bound BufferObject). 0 may be used to indicate
tightly packed data.
- elementType Tag identifying the memory representation of the
  element.
- elementTupleSize The number of elements per vertex (e.g. a 3D
  position attribute would be 3).
- normalize Indicates the range used by the attribute data.
- See NormalizeOption for more information.
return false if the attribute array does not exist.


### setAttributeArray(name, array,
                      tupleSize, normalize);

  /** Set the @p name uniform value to int @p v. */
  bool SetUniformi(const char *name, int v);
  bool SetUniformf(const char *name, float v);
  bool SetUniform2i(const char *name, int v1, int v2);
  bool SetUniform2f(const char *name, float v1, float v2);
  bool SetUniform3f(const char *name, float v1, float v2, float v3);
  bool SetUniform3fArray(const char *name, const float v[3]);
  bool SetUniform4f(const char *name, const float v[4]);
  bool SetUniform3uc(const char *name, const unsigned char v[3]); // maybe remove
  bool SetUniform4uc(const char *name, const unsigned char v[4]); // maybe remove
  bool SetUniformMatrix(const char *name, vtkMatrix3x3 *v);
  bool SetUniformMatrix(const char *name, vtkMatrix4x4 *v);
  bool SetUniformMatrix3x3(const char *name, float *v);
  bool SetUniformMatrix4x4(const char *name, float *v);

  /** Set the @p name uniform array to @p f with @p count elements */
  bool SetUniform1iv(const char *name, const int count, const int *f);
  bool SetUniform1fv(const char *name, const int count, const float *f);
  bool SetUniform2fv(const char *name, const int count, const float (*f)[2]);
  bool SetUniform3fv(const char *name, const int count, const float (*f)[3]);
  bool SetUniform4fv(const char *name, const int count, const float (*f)[4]);
  bool SetUniformMatrix4x4v(const char *name, const int count, float *v);

  // How many outputs does this program produce
  // only valid for OpenGL 3.2 or later
  vtkSetMacro(NumberOfOutputs,unsigned int);

//BTX
  // Description:
  // perform in place string substitutions, indicate if a substitution was done
  // this is useful for building up shader strings which typically involve
  // lots of string substitutions. Return true if a substitution was done.
  static bool Substitute(
    std::string &source,
    const std::string &search,
    const std::string &replace,
    bool all = true);

  // Description:
  // methods to inquire as to what uniforms/attributes are used by
  // this shader. This can save some compute time if the uniforms
  // or attributes are expensive to compute
  bool IsUniformUsed(const char *);

  // Description:
  // Return true if the compiled and linked shader has an attribute matching @a
  // name.
  bool IsAttributeUsed(const char *name);

   */

### attachShader(shader)

* Attach the supplied shader to this program.
* @note A maximum of one Vertex shader and one Fragment shader can be
* attached to a shader program.
* @return true on success.

   */
### detachShader(shader)

/** Detach the supplied shader from this program.
 * @note A maximum of one Vertex shader and one Fragment shader can be
 * attached to a shader program.
 * @return true on success.

### compileShader()

Compile this shader program and attached shaders

### link()

* Attempt to link the shader program.
* @return false on failure. Query error to get the reason.
* @note The shaders attached to the program must have been compiled.

### bind()

Bind the program in order to use it. If the program has not been linked
then link() will be called.

### release();

Releases the shader program from the current context. */
