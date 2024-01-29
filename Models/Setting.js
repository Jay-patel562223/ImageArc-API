const joi = require("joi");
const mongoose = require("mongoose");

const schema = mongoose.Schema({
  options: {
    seo: {
      // ogImage: {
      //   type: String,
      //   required: false,
      // },
      ogTitle: {
        type: String,
        required: false,
      },
      metaTags: {
        type: String,
        required: false,
      },
      metaTitle: {
        type: String,
        required: false,
      },
      canonicalUrl: {
        type: String,
        required: false,
      },
      ogDescription: {
        type: String,
        required: false,
      },
      twitterHandle: {
        type: String,
        required: false,
      },
      metaDescription: {
        type: String,
        required: false,
      },
      twitterCardType: {
        type: String,
        required: false,
      },
    },
    logo: {
      id: {
        type: String,
        required: false,
      },
      original: {
        type: String,
        required: false,
      },
      thumbnail: {
        type: String,
        required: false,
      },
    },
    useOtp: {
      type: Boolean,
      required: false,
    },
    currency: {
      type: String,
      required: false,
    },
    taxClass: {
      type: String,
      required: false,
    },
    siteTitle: {
      type: String,
      required: false,
    },
    deliveryTime: {
      type: Array,
      required: false,
    },
    signupPoints: {
      type: String,
      required: false,
    },
    siteSubtitle: {
      type: String,
      required: false,
    },
    shippingClass: {
      type: String,
      required: false,
    },
    contactDetails: {
      contact: {
        type: String,
        required: false,
      },
      socials: {
        type: Array,
        required: false,
      },
      website: {
        type: String,
        required: false,
      },
      location: {
        lat: {
          type: String,
          required: false,
        },
        lng: {
          type: String,
          required: false,
        },
        zip: {
          type: String,
          required: false,
        },
        city: {
          type: String,
          required: false,
        },
        state: {
          type: String,
          required: false,
        },
        country: {
          type: String,
          required: false,
        },
        formattedAddress: {
          type: String,
          required: false,
        },
      },
    },
    language: {
      type: String,
      required: false,
    },
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
      select: false,
    },
    updated_at: {
      type: Date,
      required: true,
      default: Date.now,
      select: false,
    },
  },
});

module.exports = {
  Setting: mongoose.model("Setting", schema),
};
