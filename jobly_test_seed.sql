--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3
-- Dumped by pg_dump version 12.3

SET statement_timeout
= 0;
SET lock_timeout
= 0;
SET idle_in_transaction_session_timeout
= 0;
SET client_encoding
= 'UTF8';
SET standard_conforming_strings
= on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies
= false;
SET xmloption
= content;
SET client_min_messages
= warning;
SET row_security
= off;

SET default_tablespace
= '';

SET default_table_access_method
= heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies
(
    handle text NOT NULL,
    name text NOT NULL,
    num_employees integer,
    description text,
    logo_url text
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs
(
    id SERIAL NOT NULL,
    title text NOT NULL,
    salary double precision NOT NULL,
    equity double precision NOT NULL,
    company_handle text,
    date_posted timestamp
    without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT jobs_equity_check CHECK
    ((equity >
    (0)::double precision)),
    CONSTRAINT jobs_equity_check1 CHECK
    ((equity <
    (1.0)::double precision))
);


    ALTER TABLE public.jobs OWNER TO postgres;

    --
    -- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
    --

    CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


    ALTER TABLE public.jobs_id_seq OWNER TO postgres;

    --
    -- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
    --

    ALTER SEQUENCE public.jobs_id_seq
    OWNED BY public.jobs.id;


    --
    -- Name: users; Type: TABLE; Schema: public; Owner: postgres
    --

    CREATE TABLE public.users
    (
        username text NOT NULL,
        password text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text NOT NULL,
        photo_url text,
        is_admin boolean DEFAULT false NOT NULL
    );


    ALTER TABLE public.users OWNER TO postgres;

    --
    -- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.jobs
    ALTER COLUMN id
    SET
    DEFAULT nextval
    ('public.jobs_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies
    (handle, name, num_employees, description, logo_url) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs
    (id, title, salary, equity, company_handle, date_posted) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users
    (username, password, first_name, last_name, email, photo_url, is_admin) FROM stdin;
\.


    --
    -- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
    --

    SELECT pg_catalog.setval('public.jobs_id_seq', 366, true);


    --
    -- Name: companies companies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_key UNIQUE
    (name);


    --
    -- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY
    (handle);


    --
    -- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY
    (id);


    --
    -- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE
    (email);


    --
    -- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY
    (username);


    --
    -- Name: jobs jobs_company_handle_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
    --

    ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_handle_fkey FOREIGN KEY
    (company_handle) REFERENCES public.companies
    (handle) ON
    DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

