DROP TABLE if exists public.order_items;
DROP TABLE if exists public.shipping_addresses;
DROP TABLE if exists public.orders;
DROP TABLE if exists public.customers;


-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	id bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT customers_email_key UNIQUE (email),
	CONSTRAINT customers_pkey PRIMARY KEY (id)
);


-- public.orders definition

-- Drop table

-- DROP TABLE public.orders;

CREATE TABLE public.orders (
	id bigserial NOT NULL,
	source_order_id int8 NOT NULL,
	"timestamp" timestamptz NULL,
	"totalAmount" numeric(10, 2) NULL,
	"customerId" int8 NULL,
	CONSTRAINT orders_pkey PRIMARY KEY (id),
	CONSTRAINT orders_ukey UNIQUE (source_order_id),
	CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON DELETE SET NULL ON UPDATE CASCADE
);


-- public.shipping_addresses definition

-- Drop table

-- DROP TABLE public.shipping_addresses;

CREATE TABLE public.shipping_addresses (
	id bigserial NOT NULL,
	street varchar(255) NULL,
	city varchar(255) NULL,
	"zipCode" varchar(255) NULL,
	country varchar(255) NULL,
	"orderId" int8 NULL,
	CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id),
	CONSTRAINT "shipping_addresses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE SET NULL ON UPDATE CASCADE
);


-- public.order_items definition

-- Drop table

-- DROP TABLE public.order_items;

CREATE TABLE public.order_items (
	id bigserial NOT NULL,
	"productId" varchar(255) NULL,
	"productName" varchar(255) NULL,
	quantity int4 NULL,
	price numeric(10, 2) NULL,
	"orderId" int8 NULL,
	CONSTRAINT order_items_pkey PRIMARY KEY (id),
	CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE SET NULL ON UPDATE CASCADE
);