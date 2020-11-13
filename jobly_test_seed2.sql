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

--
-- Name: state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.state AS ENUM
(
    'interested',
    'applied',
    'accepted',
    'rejected'
);


ALTER TYPE public.state OWNER TO postgres;

SET default_tablespace
= '';

SET default_table_access_method
= heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications
(
    username text NOT NULL,
    job_id integer NOT NULL,
    state
    public.state NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


    ALTER TABLE public.applications OWNER TO postgres;

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
        -- Name: technologies; Type: TABLE; Schema: public; Owner: postgres
        --

        CREATE TABLE public.technologies
        (
            id SERIAL NOT NULL,
            technology text NOT NULL
        );


        ALTER TABLE public.technologies OWNER TO postgres;

        --
        -- Name: technologies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
        --

        CREATE SEQUENCE public.technologies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


        ALTER TABLE public.technologies_id_seq OWNER TO postgres;

        --
        -- Name: technologies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
        --

        ALTER SEQUENCE public.technologies_id_seq
        OWNED BY public.technologies.id;


        --
        -- Name: technologies_jobs; Type: TABLE; Schema: public; Owner: postgres
        --

        CREATE TABLE public.technologies_jobs
        (
            job_id integer NOT NULL,
            technology_id integer NOT NULL
        );


        ALTER TABLE public.technologies_jobs OWNER TO postgres;

        --
        -- Name: technologies_users; Type: TABLE; Schema: public; Owner: postgres
        --

        CREATE TABLE public.technologies_users
        (
            username text NOT NULL,
            technology_id integer NOT NULL
        );


        ALTER TABLE public.technologies_users OWNER TO postgres;

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
        -- Name: technologies id; Type: DEFAULT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies
        ALTER COLUMN id
        SET
        DEFAULT nextval
        ('public.technologies_id_seq'::regclass);


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications
        (username, job_id, state, created_at) FROM stdin;
\.


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
-- Data for Name: technologies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.technologies
        (id, technology) FROM stdin;
\.


--
-- Data for Name: technologies_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.technologies_jobs
        (job_id, technology_id) FROM stdin;
\.


--
-- Data for Name: technologies_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.technologies_users
        (username, technology_id) FROM stdin;
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

        SELECT pg_catalog.setval('public.jobs_id_seq', 106, true);


        --
        -- Name: technologies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
        --

        SELECT pg_catalog.setval('public.technologies_id_seq', 1, false);


        --
        -- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.applications
        ADD CONSTRAINT applications_pkey PRIMARY KEY
        (username, job_id);


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
        -- Name: technologies_jobs technologies_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_jobs
        ADD CONSTRAINT technologies_jobs_pkey PRIMARY KEY
        (job_id, technology_id);


        --
        -- Name: technologies technologies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies
        ADD CONSTRAINT technologies_pkey PRIMARY KEY
        (id);


        --
        -- Name: technologies technologies_technology_key; Type: CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies
        ADD CONSTRAINT technologies_technology_key UNIQUE
        (technology);


        --
        -- Name: technologies_users technologies_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_users
        ADD CONSTRAINT technologies_users_pkey PRIMARY KEY
        (username, technology_id);


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
        -- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.applications
        ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY
        (job_id) REFERENCES public.jobs
        (id) ON
        DELETE CASCADE;


        --
        -- Name: applications applications_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.applications
        ADD CONSTRAINT applications_username_fkey FOREIGN KEY
        (username) REFERENCES public.users
        (username) ON
        DELETE CASCADE;


        --
        -- Name: jobs jobs_company_handle_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.jobs
        ADD CONSTRAINT jobs_company_handle_fkey FOREIGN KEY
        (company_handle) REFERENCES public.companies
        (handle) ON
        DELETE CASCADE;


        --
        -- Name: technologies_jobs technologies_jobs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_jobs
        ADD CONSTRAINT technologies_jobs_job_id_fkey FOREIGN KEY
        (job_id) REFERENCES public.jobs
        (id) ON
        DELETE CASCADE;


        --
        -- Name: technologies_jobs technologies_jobs_technology_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_jobs
        ADD CONSTRAINT technologies_jobs_technology_id_fkey FOREIGN KEY
        (technology_id) REFERENCES public.technologies
        (id) ON
        DELETE CASCADE;


        --
        -- Name: technologies_users technologies_users_technology_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_users
        ADD CONSTRAINT technologies_users_technology_id_fkey FOREIGN KEY
        (technology_id) REFERENCES public.technologies
        (id) ON
        DELETE CASCADE;


        --
        -- Name: technologies_users technologies_users_username_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
        --

        ALTER TABLE ONLY public.technologies_users
        ADD CONSTRAINT technologies_users_username_fkey FOREIGN KEY
        (username) REFERENCES public.users
        (username) ON
        DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

