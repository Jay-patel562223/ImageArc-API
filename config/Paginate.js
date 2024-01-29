const env = require("dotenv").config().parsed;

const paginate = (
  totalItems,
  current_page = 1,
  pageSize = 10,
  count = 0,
  // maxPages = 10,
  url = ""
) => {
  const APP_URL = env.APP_URL;
  // calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // ensure current page isn't out of range
  if (current_page < 1) {
    current_page = 1;
  } else if (current_page > totalPages) {
    current_page = totalPages;
  }

  // calculate start and end item indexes
  let startIndex = (current_page - 1) * pageSize;
  let endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // create an array of pages to ng-repeat in the pager control
  // const pages = Array.from(Array(endPage + 1 - startPage).keys()).map(
  //   (i) => startPage + i,
  // );

  // return object with all pager properties required by the view

  if (totalItems == 0) {
    startIndex = 0;
    endIndex = 0;
  }

  return {
    total: totalItems,
    current_page: +current_page,
    count,
    last_page: totalPages,
    firstItem: startIndex,
    lastItem: endIndex,
    per_page: pageSize,
    first_page_url: `${APP_URL}${url}&page=1`,
    last_page_url: `${APP_URL}${url}&page=${totalPages}`,
    next_page_url:
      totalPages > current_page
        ? `${APP_URL}${url}&page=${Number(current_page) + 1}`
        : null,
    prev_page_url:
      totalPages > current_page
        ? `${APP_URL}${url}&page=${current_page}`
        : null,
  };
};

module.exports = {
  paginate: paginate,
};
