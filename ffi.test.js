import { dlopen, FFIType, suffix, CString, ptr } from "bun:ffi";

const encoder = new TextEncoder();
const path = `liblib.${suffix}`;

const lib = dlopen(path, {
  add: {
    args: [FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
  print_string: {
    args: [FFIType.ptr]
  }
});

const my_string = new String('Hey');
const string_buffer = encoder.encode(my_string);
console.log(string_buffer);

const my_ptr = ptr(string_buffer);

console.log(my_ptr);

lib.symbols.print_string(my_ptr);