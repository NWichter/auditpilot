declare module "jstat" {
  export const jStat: {
    chisquare: {
      cdf: (x: number, df: number) => number;
    };
  };
}
