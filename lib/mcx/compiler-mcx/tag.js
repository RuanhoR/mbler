class CompileTags {
  static SpecifierAllTag = class SpecifierAllTag {
    /**
     * @method 检查某个值是否为All标记
     * @param {*} target - 检查的值
     * @returns {boolean}
     */
    equals(target) {
      return target instanceof CompileTags.SpecifierAllTag 
    }
  }
}
module.exports = CompileTags;