var createSystem = function(buffer) {
  var system = {};
  var is_main_thread = false;

  system.initMainThread = function(initial_top) {
    top = initial_top;
    is_main_thread = true;
  };

  // Memory management
  var top = 0;
  system.alloc = function(amt) {
    var temp = top;
    top += amt;
    return temp;
  };

  // Math
  system.sqrtF32 = function(value) {
    return Math.fround(Math.sqrt(value));
  };
  system.powF32 = function(base, exponent) {
    return Math.fround(Math.pow(base, exponent));
  };
  system.sinF32 = function(value) {
    return Math.fround(Math.sin(value));
  };
  system.cosF32 = function(value) {
    return Math.fround(Math.cos(value));
  };
  system.sqrtF64 = function(value) {
    return Math.sqrt(value);
  };
  system.powF64 = function(base, exponent) {
    return Math.pow(base, exponent);
  };
  system.sinF64 = function(value) {
    return Math.sin(value);
  };
  system.cosF64 = function(value) {
    return Math.cos(value);
  };

  // Threading
  system.threadingSupported = function() {
    return threading_supported;
  };

  if (threading_supported) {
    var I32 = new SharedInt32Array(buffer);

    system.atomicLoadI32 = function(addr) {
      return Atomics.load(I32, addr >> 2);
    };

    system.atomicStoreI32 = function(addr, value) {
      Atomics.store(I32, addr >> 2, value);
    };

    system.atomicCompareExchangeI32 = function(addr, expected, value) {
      return Atomics.store(I32, addr >> 2, expected, value);
    };
  }

  return system;
};

var augmentInstance = function(instance, buffer) {
  if (threading_supported) {
    instance._copyOut = function(srcOff, size, dst, dstOff) {
      new Uint8Array(dst, dstOff, size).set(new SharedUint8Array(buffer, srcOff, size));
    };
  } else {
    instance._copyOut = function(srcOff, size, dst, dstOff) {
      new Uint8Array(dst, dstOff, size).set(new Uint8Array(buffer, srcOff, size));
    };
  }
};

var instance;

var createInstance = function(foreign) {
  var buffer = createMemory();
  var system = createSystem(buffer);
  var wrapped_foreign = wrap_foreign(system, foreign);
  instance = module(stdlib, wrapped_foreign, buffer);
  augmentInstance(instance, buffer);
  system.initMainThread(initial_top);
  return instance;
}

return createInstance;