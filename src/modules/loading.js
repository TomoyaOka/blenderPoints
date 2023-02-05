//https://alpinejs.dev/directives/data
export default () => ({
  isActive: false,
  image() {
    const imgArea = document.querySelector(".archive-image");
    return imgArea;
  },
  toggle() {
    // const start = performance.now();
    // this.isActive = true;
    // this.image().addEventListener("load", () => {
    //   this.isActive = false;
    //   // 実行時間を計測した処理
    //   const end = performance.now();
    //   console.log(end - start);
    //   console.log("a");
    // });
  },
});
