import { parseAsString, parseAsInteger, createSearchParamsCache } from "nuqs/server";

const shallow = false;

export const generatorSearchParams = {
  search: parseAsString.withDefault("").withOptions({ shallow }),
  type:   parseAsString.withDefault("").withOptions({ shallow }),
  page:   parseAsInteger.withDefault(1).withOptions({ shallow }),
};

export const generatorParamsCache = createSearchParamsCache(generatorSearchParams);
