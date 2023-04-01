module.exports = (modifier) => {
   function prefixWithZero (number) {
      if (number < 10) {
         return '0' + number;
      }
      return number;
   }
   const now = new Date();
   switch (modifier) {
      case '-1h':
         now.setHours(now.getHours() - 1);
         break;
      default: break;
   }
   return now.getFullYear() +
         prefixWithZero(now.getMonth() + 1) +
         prefixWithZero(now.getDate()) +
         prefixWithZero(now.getHours()) +
         prefixWithZero(now.getMinutes()) +
         prefixWithZero(now.getSeconds());
};
