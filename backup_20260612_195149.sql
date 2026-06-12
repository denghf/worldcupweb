--
-- PostgreSQL database dump
--

\restrict LWWj2Pebhsd0v1ZnmBzZuPWnSscuVuOmxEXRPd8OrvYV8QImZRPa18MUBYxgZeN

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.wallets DROP CONSTRAINT "wallets_userId_fkey";
ALTER TABLE ONLY public.user_stats DROP CONSTRAINT "user_stats_userId_fkey";
ALTER TABLE ONLY public.transactions DROP CONSTRAINT "transactions_userId_fkey";
ALTER TABLE ONLY public.transactions DROP CONSTRAINT "transactions_operatorId_fkey";
ALTER TABLE ONLY public.odds DROP CONSTRAINT "odds_matchId_fkey";
ALTER TABLE ONLY public.matches DROP CONSTRAINT "matches_tournamentId_fkey";
ALTER TABLE ONLY public.bets DROP CONSTRAINT "bets_userId_fkey";
ALTER TABLE ONLY public.bet_items DROP CONSTRAINT "bet_items_matchId_fkey";
ALTER TABLE ONLY public.bet_items DROP CONSTRAINT "bet_items_betId_fkey";
DROP INDEX public."wallets_userId_key";
DROP INDEX public.users_username_key;
DROP INDEX public."user_stats_userId_key";
DROP INDEX public."transactions_userId_idx";
DROP INDEX public."transactions_createdAt_idx";
DROP INDEX public."odds_matchId_betType_optionKey_key";
DROP INDEX public."matches_tournamentId_idx";
DROP INDEX public.matches_status_idx;
DROP INDEX public."matches_kickoffTime_idx";
DROP INDEX public."matches_apiMatchId_key";
DROP INDEX public."bets_userId_idx";
DROP INDEX public.bets_status_idx;
DROP INDEX public."bets_betUid_key";
DROP INDEX public."bet_items_matchId_idx";
DROP INDEX public."bet_items_betId_idx";
ALTER TABLE ONLY public.wallets DROP CONSTRAINT wallets_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.user_stats DROP CONSTRAINT user_stats_pkey;
ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_pkey;
ALTER TABLE ONLY public.tournaments DROP CONSTRAINT tournaments_pkey;
ALTER TABLE ONLY public.odds DROP CONSTRAINT odds_pkey;
ALTER TABLE ONLY public.matches DROP CONSTRAINT matches_pkey;
ALTER TABLE ONLY public.bets DROP CONSTRAINT bets_pkey;
ALTER TABLE ONLY public.bet_items DROP CONSTRAINT bet_items_pkey;
ALTER TABLE public.wallets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_stats ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.tournaments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.odds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.matches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.bets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.bet_items ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.wallets_id_seq;
DROP TABLE public.wallets;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.user_stats_id_seq;
DROP TABLE public.user_stats;
DROP SEQUENCE public.transactions_id_seq;
DROP TABLE public.transactions;
DROP SEQUENCE public.tournaments_id_seq;
DROP TABLE public.tournaments;
DROP SEQUENCE public.odds_id_seq;
DROP TABLE public.odds;
DROP SEQUENCE public.matches_id_seq;
DROP TABLE public.matches;
DROP SEQUENCE public.bets_id_seq;
DROP TABLE public.bets;
DROP SEQUENCE public.bet_items_id_seq;
DROP TABLE public.bet_items;
DROP TYPE public.user_status;
DROP TYPE public.tx_type;
DROP TYPE public.tournament_status;
DROP TYPE public.role;
DROP TYPE public.match_status;
DROP TYPE public.bet_type;
DROP TYPE public.bet_status;
DROP TYPE public.bet_mode;
DROP TYPE public.bet_item_result;
--
-- Name: bet_item_result; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.bet_item_result AS ENUM (
    'PENDING',
    'WON',
    'LOST',
    'CANCELLED'
);


ALTER TYPE public.bet_item_result OWNER TO hiqi;

--
-- Name: bet_mode; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.bet_mode AS ENUM (
    'SINGLE',
    'PARLAY'
);


ALTER TYPE public.bet_mode OWNER TO hiqi;

--
-- Name: bet_status; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.bet_status AS ENUM (
    'PENDING_REVIEW',
    'APPROVED',
    'ACTIVE',
    'WON',
    'LOST',
    'CANCELLED'
);


ALTER TYPE public.bet_status OWNER TO hiqi;

--
-- Name: bet_type; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.bet_type AS ENUM (
    'X1X',
    'TOTAL_GOALS',
    'CORRECT_SCORE',
    'HANDICAP_X1X',
    'HALF_FULL'
);


ALTER TYPE public.bet_type OWNER TO hiqi;

--
-- Name: match_status; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.match_status AS ENUM (
    'UPCOMING',
    'LIVE',
    'SEALED',
    'FINISHED',
    'CANCELLED',
    'POSTPONED'
);


ALTER TYPE public.match_status OWNER TO hiqi;

--
-- Name: role; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.role AS ENUM (
    'ADMIN',
    'PLAYER'
);


ALTER TYPE public.role OWNER TO hiqi;

--
-- Name: tournament_status; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.tournament_status AS ENUM (
    'UPCOMING',
    'ACTIVE',
    'FINISHED'
);


ALTER TYPE public.tournament_status OWNER TO hiqi;

--
-- Name: tx_type; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.tx_type AS ENUM (
    'RECHARGE',
    'BET',
    'WIN',
    'REFUND',
    'ADJUST'
);


ALTER TYPE public.tx_type OWNER TO hiqi;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: hiqi
--

CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'DISABLED'
);


ALTER TYPE public.user_status OWNER TO hiqi;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bet_items; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.bet_items (
    id integer NOT NULL,
    "betId" integer NOT NULL,
    "matchId" integer NOT NULL,
    "betMarket" public.bet_type NOT NULL,
    "selectedOption" character varying(50) NOT NULL,
    "lockedOdds" numeric(6,2) NOT NULL,
    result public.bet_item_result DEFAULT 'PENDING'::public.bet_item_result NOT NULL,
    "settledAt" timestamp(3) without time zone
);


ALTER TABLE public.bet_items OWNER TO hiqi;

--
-- Name: bet_items_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.bet_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bet_items_id_seq OWNER TO hiqi;

--
-- Name: bet_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.bet_items_id_seq OWNED BY public.bet_items.id;


--
-- Name: bets; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.bets (
    id integer NOT NULL,
    "betUid" character varying(36) NOT NULL,
    "userId" integer NOT NULL,
    "betMode" public.bet_mode NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    status public.bet_status DEFAULT 'PENDING_REVIEW'::public.bet_status NOT NULL,
    "lockedTotalOdds" numeric(8,2) NOT NULL,
    "potentialPayout" numeric(10,2) NOT NULL,
    "actualPayout" numeric(10,2),
    "rejectReason" character varying(200),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "settledAt" timestamp(3) without time zone
);


ALTER TABLE public.bets OWNER TO hiqi;

--
-- Name: bets_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.bets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bets_id_seq OWNER TO hiqi;

--
-- Name: bets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.bets_id_seq OWNED BY public.bets.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    "tournamentId" integer NOT NULL,
    "apiMatchId" character varying(20) NOT NULL,
    "homeTeam" character varying(50) NOT NULL,
    "awayTeam" character varying(50) NOT NULL,
    "homeTeamLogo" character varying(500),
    "awayTeamLogo" character varying(500),
    "kickoffTime" timestamp(3) without time zone NOT NULL,
    status public.match_status DEFAULT 'UPCOMING'::public.match_status NOT NULL,
    "homeScore" integer,
    "awayScore" integer,
    "oddsUpdatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "finalAwayScore" integer,
    "finalHomeScore" integer,
    "halfAwayScore" integer,
    "halfHomeScore" integer
);


ALTER TABLE public.matches OWNER TO hiqi;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO hiqi;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: odds; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.odds (
    id integer NOT NULL,
    "matchId" integer NOT NULL,
    "betType" public.bet_type NOT NULL,
    "optionKey" character varying(50) NOT NULL,
    "oddsValue" numeric(6,2) NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.odds OWNER TO hiqi;

--
-- Name: odds_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.odds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.odds_id_seq OWNER TO hiqi;

--
-- Name: odds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.odds_id_seq OWNED BY public.odds.id;


--
-- Name: tournaments; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.tournaments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "leagueId" integer NOT NULL,
    season character(4) NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public.tournament_status DEFAULT 'UPCOMING'::public.tournament_status NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tournaments OWNER TO hiqi;

--
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournaments_id_seq OWNER TO hiqi;

--
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type public.tx_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    "balanceAfter" numeric(10,2) NOT NULL,
    "relatedBetId" integer,
    "operatorId" integer,
    remark character varying(200),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.transactions OWNER TO hiqi;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO hiqi;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.user_stats (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "totalBets" integer DEFAULT 0 NOT NULL,
    "totalWonBets" integer DEFAULT 0 NOT NULL,
    "totalBetAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalWinAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "netProfit" numeric(12,2) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_stats OWNER TO hiqi;

--
-- Name: user_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.user_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_stats_id_seq OWNER TO hiqi;

--
-- Name: user_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.user_stats_id_seq OWNED BY public.user_stats.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(20) NOT NULL,
    nickname character varying(20) NOT NULL,
    avatar character varying(500),
    role public.role DEFAULT 'PLAYER'::public.role NOT NULL,
    status public.user_status DEFAULT 'ACTIVE'::public.user_status NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO hiqi;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO hiqi;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: hiqi
--

CREATE TABLE public.wallets (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    balance numeric(10,2) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wallets OWNER TO hiqi;

--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: hiqi
--

CREATE SEQUENCE public.wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallets_id_seq OWNER TO hiqi;

--
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hiqi
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- Name: bet_items id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bet_items ALTER COLUMN id SET DEFAULT nextval('public.bet_items_id_seq'::regclass);


--
-- Name: bets id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bets ALTER COLUMN id SET DEFAULT nextval('public.bets_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: odds id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.odds ALTER COLUMN id SET DEFAULT nextval('public.odds_id_seq'::regclass);


--
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: user_stats id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.user_stats ALTER COLUMN id SET DEFAULT nextval('public.user_stats_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- Data for Name: bet_items; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.bet_items (id, "betId", "matchId", "betMarket", "selectedOption", "lockedOdds", result, "settledAt") FROM stdin;
57	53	110	X1X	home	1.61	PENDING	\N
58	54	110	CORRECT_SCORE	2:1	5.30	PENDING	\N
59	55	111	HALF_FULL	胜平	27.00	LOST	2026-06-12 10:56:22.76
60	57	111	HANDICAP_X1X	2:draw	3.75	WON	2026-06-12 10:56:22.761
61	56	111	CORRECT_SCORE	2:1	32.00	LOST	2026-06-12 10:56:22.762
62	58	111	HANDICAP_X1X	2:draw	4.75	WON	2026-06-12 10:56:22.763
\.


--
-- Data for Name: bets; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.bets (id, "betUid", "userId", "betMode", "totalAmount", status, "lockedTotalOdds", "potentialPayout", "actualPayout", "rejectReason", "createdAt", "settledAt") FROM stdin;
53	3b645957-6f50-4b5a-bcbf-806f236fd516	8	SINGLE	5.00	APPROVED	1.61	8.05	\N	\N	2026-06-12 10:41:45.135	\N
54	daf95cef-5907-4a55-8267-5d14ddcf6d5f	8	SINGLE	5.00	APPROVED	5.30	26.50	\N	\N	2026-06-12 10:41:45.136	\N
55	00beec7a-def7-4282-9eba-6230e273c615	7	SINGLE	5.00	LOST	27.00	135.00	0.00	\N	2026-06-12 10:42:00.112	2026-06-12 10:56:22.765
56	7eea9e10-d6c7-4d45-8ff0-d333d1ad2733	7	SINGLE	5.00	LOST	32.00	160.00	0.00	\N	2026-06-12 10:42:00.113	2026-06-12 10:56:22.765
57	a0dcaf51-5835-4f61-868a-120bb99ad39b	7	SINGLE	5.00	WON	3.75	18.75	18.75	\N	2026-06-12 10:42:00.114	2026-06-12 10:56:22.766
58	2396cc7c-e5f9-4200-9d12-9b4bf9912691	8	SINGLE	5.00	WON	4.75	23.75	23.75	\N	2026-06-12 10:53:55.553	2026-06-12 10:56:22.774
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.matches (id, "tournamentId", "apiMatchId", "homeTeam", "awayTeam", "homeTeamLogo", "awayTeamLogo", "kickoffTime", status, "homeScore", "awayScore", "oddsUpdatedAt", "createdAt", "updatedAt", "finalAwayScore", "finalHomeScore", "halfAwayScore", "halfHomeScore") FROM stdin;
106	1	wc2026-a03	捷克	南非	\N	\N	2026-06-19 00:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.14	2026-06-11 12:34:44.14	\N	\N	\N	\N
107	1	wc2026-a04	墨西哥	韩国	\N	\N	2026-06-19 09:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.143	2026-06-11 12:34:44.143	\N	\N	\N	\N
108	1	wc2026-a05	捷克	墨西哥	\N	\N	2026-06-25 09:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.148	2026-06-11 12:34:44.148	\N	\N	\N	\N
109	1	wc2026-a06	南非	韩国	\N	\N	2026-06-25 09:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.153	2026-06-11 12:34:44.153	\N	\N	\N	\N
112	1	wc2026-b03	瑞士	波黑	\N	\N	2026-06-19 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.166	2026-06-11 12:34:44.166	\N	\N	\N	\N
113	1	wc2026-b04	加拿大	卡塔尔	\N	\N	2026-06-19 06:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.171	2026-06-11 12:34:44.171	\N	\N	\N	\N
114	1	wc2026-b05	瑞士	加拿大	\N	\N	2026-06-25 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.177	2026-06-11 12:34:44.177	\N	\N	\N	\N
115	1	wc2026-b06	波黑	卡塔尔	\N	\N	2026-06-25 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.18	2026-06-11 12:34:44.18	\N	\N	\N	\N
118	1	wc2026-c03	苏格兰	摩洛哥	\N	\N	2026-06-20 06:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.188	2026-06-11 12:34:44.188	\N	\N	\N	\N
119	1	wc2026-c04	巴西	海地	\N	\N	2026-06-20 09:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.191	2026-06-11 12:34:44.191	\N	\N	\N	\N
120	1	wc2026-c05	苏格兰	巴西	\N	\N	2026-06-25 06:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.193	2026-06-11 12:34:44.193	\N	\N	\N	\N
121	1	wc2026-c06	摩洛哥	海地	\N	\N	2026-06-25 06:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.196	2026-06-11 12:34:44.196	\N	\N	\N	\N
124	1	wc2026-d03	美国	澳大利亚	\N	\N	2026-06-20 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.205	2026-06-11 12:34:44.205	\N	\N	\N	\N
125	1	wc2026-d04	土耳其	巴拉圭	\N	\N	2026-06-20 11:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.207	2026-06-11 12:34:44.207	\N	\N	\N	\N
126	1	wc2026-d05	土耳其	美国	\N	\N	2026-06-26 10:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.21	2026-06-11 12:34:44.21	\N	\N	\N	\N
127	1	wc2026-d06	巴拉圭	澳大利亚	\N	\N	2026-06-26 10:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.212	2026-06-11 12:34:44.212	\N	\N	\N	\N
130	1	wc2026-e03	德国	科特迪瓦	\N	\N	2026-06-21 04:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.222	2026-06-11 12:34:44.222	\N	\N	\N	\N
131	1	wc2026-e04	厄瓜多尔	库拉索	\N	\N	2026-06-21 08:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.225	2026-06-11 12:34:44.225	\N	\N	\N	\N
132	1	wc2026-e05	厄瓜多尔	德国	\N	\N	2026-06-26 04:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.229	2026-06-11 12:34:44.229	\N	\N	\N	\N
133	1	wc2026-e06	库拉索	科特迪瓦	\N	\N	2026-06-26 04:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.231	2026-06-11 12:34:44.231	\N	\N	\N	\N
136	1	wc2026-f03	荷兰	瑞典	\N	\N	2026-06-21 01:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.238	2026-06-11 12:34:44.238	\N	\N	\N	\N
137	1	wc2026-f04	突尼斯	日本	\N	\N	2026-06-20 12:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.239	2026-06-11 12:34:44.239	\N	\N	\N	\N
138	1	wc2026-f05	突尼斯	荷兰	\N	\N	2026-06-26 07:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.242	2026-06-11 12:34:44.242	\N	\N	\N	\N
139	1	wc2026-f06	日本	瑞典	\N	\N	2026-06-26 07:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.244	2026-06-11 12:34:44.244	\N	\N	\N	\N
142	1	wc2026-g03	比利时	伊朗	\N	\N	2026-06-22 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.251	2026-06-11 12:34:44.251	\N	\N	\N	\N
143	1	wc2026-g04	新西兰	埃及	\N	\N	2026-06-22 09:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.254	2026-06-11 12:34:44.254	\N	\N	\N	\N
144	1	wc2026-g05	新西兰	比利时	\N	\N	2026-06-27 11:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.256	2026-06-11 12:34:44.256	\N	\N	\N	\N
145	1	wc2026-g06	埃及	伊朗	\N	\N	2026-06-27 11:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.259	2026-06-11 12:34:44.259	\N	\N	\N	\N
148	1	wc2026-h03	西班牙	沙特	\N	\N	2026-06-22 00:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.265	2026-06-11 12:34:44.265	\N	\N	\N	\N
149	1	wc2026-h04	乌拉圭	佛得角	\N	\N	2026-06-22 06:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.266	2026-06-11 12:34:44.266	\N	\N	\N	\N
150	1	wc2026-h05	乌拉圭	西班牙	\N	\N	2026-06-27 08:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.268	2026-06-11 12:34:44.268	\N	\N	\N	\N
151	1	wc2026-h06	佛得角	沙特	\N	\N	2026-06-27 08:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.27	2026-06-11 12:34:44.27	\N	\N	\N	\N
154	1	wc2026-i03	法国	伊拉克	\N	\N	2026-06-23 05:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.277	2026-06-11 12:34:44.277	\N	\N	\N	\N
155	1	wc2026-i04	挪威	塞内加尔	\N	\N	2026-06-23 08:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.279	2026-06-11 12:34:44.279	\N	\N	\N	\N
156	1	wc2026-i05	挪威	法国	\N	\N	2026-06-27 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.281	2026-06-11 12:34:44.281	\N	\N	\N	\N
157	1	wc2026-i06	塞内加尔	伊拉克	\N	\N	2026-06-27 03:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.283	2026-06-11 12:34:44.283	\N	\N	\N	\N
160	1	wc2026-j03	阿根廷	奥地利	\N	\N	2026-06-23 01:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.289	2026-06-11 12:34:44.289	\N	\N	\N	\N
161	1	wc2026-j04	约旦	阿尔及利亚	\N	\N	2026-06-23 11:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.292	2026-06-11 12:34:44.292	\N	\N	\N	\N
162	1	wc2026-j05	约旦	阿根廷	\N	\N	2026-06-28 10:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.294	2026-06-11 12:34:44.294	\N	\N	\N	\N
163	1	wc2026-j06	阿尔及利亚	奥地利	\N	\N	2026-06-28 10:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.296	2026-06-11 12:34:44.296	\N	\N	\N	\N
166	1	wc2026-k03	葡萄牙	乌兹别克斯坦	\N	\N	2026-06-24 01:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.302	2026-06-11 12:34:44.302	\N	\N	\N	\N
167	1	wc2026-k04	哥伦比亚	刚果（金）	\N	\N	2026-06-24 10:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.305	2026-06-11 12:34:44.305	\N	\N	\N	\N
168	1	wc2026-k05	哥伦比亚	葡萄牙	\N	\N	2026-06-28 07:30:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.307	2026-06-11 12:34:44.307	\N	\N	\N	\N
169	1	wc2026-k06	刚果（金）	乌兹别克斯坦	\N	\N	2026-06-28 07:30:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.308	2026-06-11 12:34:44.308	\N	\N	\N	\N
172	1	wc2026-l03	英格兰	加纳	\N	\N	2026-06-24 04:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.314	2026-06-11 12:34:44.314	\N	\N	\N	\N
173	1	wc2026-l04	巴拿马	克罗地亚	\N	\N	2026-06-24 07:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.315	2026-06-11 12:34:44.315	\N	\N	\N	\N
174	1	wc2026-l05	巴拿马	英格兰	\N	\N	2026-06-28 05:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.317	2026-06-11 12:34:44.317	\N	\N	\N	\N
175	1	wc2026-l06	克罗地亚	加纳	\N	\N	2026-06-28 05:00:00	UPCOMING	\N	\N	\N	2026-06-11 12:34:44.319	2026-06-11 12:34:44.319	\N	\N	\N	\N
128	1	wc2026-e01	德国	库拉索	\N	\N	2026-06-14 17:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.11	2026-06-11 12:34:44.216	2026-06-12 10:53:25.11	\N	\N	\N	\N
134	1	wc2026-f01	荷兰	日本	\N	\N	2026-06-14 20:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.116	2026-06-11 12:34:44.233	2026-06-12 10:53:25.116	\N	\N	\N	\N
129	1	wc2026-e02	科特迪瓦	厄瓜多尔	\N	\N	2026-06-14 23:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.125	2026-06-11 12:34:44.219	2026-06-12 10:53:25.125	\N	\N	\N	\N
135	1	wc2026-f02	瑞典	突尼斯	\N	\N	2026-06-15 02:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.13	2026-06-11 12:34:44.236	2026-06-12 10:53:25.13	\N	\N	\N	\N
146	1	wc2026-h01	西班牙	佛得角	\N	\N	2026-06-15 16:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.134	2026-06-11 12:34:44.261	2026-06-12 10:53:25.134	\N	\N	\N	\N
140	1	wc2026-g01	比利时	埃及	\N	\N	2026-06-15 19:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.138	2026-06-11 12:34:44.246	2026-06-12 10:53:25.138	\N	\N	\N	\N
147	1	wc2026-h02	沙特	乌拉圭	\N	\N	2026-06-15 22:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.143	2026-06-11 12:34:44.263	2026-06-12 10:53:25.143	\N	\N	\N	\N
141	1	wc2026-g02	伊朗	新西兰	\N	\N	2026-06-16 01:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.147	2026-06-11 12:34:44.248	2026-06-12 10:53:25.147	\N	\N	\N	\N
152	1	wc2026-i01	法国	塞内加尔	\N	\N	2026-06-16 19:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.151	2026-06-11 12:34:44.271	2026-06-12 10:53:25.151	\N	\N	\N	\N
153	1	wc2026-i02	伊拉克	挪威	\N	\N	2026-06-16 22:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.156	2026-06-11 12:34:44.274	2026-06-12 10:53:25.156	\N	\N	\N	\N
158	1	wc2026-j01	阿根廷	阿尔及利亚	\N	\N	2026-06-17 01:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.159	2026-06-11 12:34:44.285	2026-06-12 10:53:25.159	\N	\N	\N	\N
105	1	wc2026-a02	韩国	捷克	\N	\N	2026-06-12 02:00:00	FINISHED	2	1	2026-06-11 12:34:51.6	2026-06-11 12:34:44.135	2026-06-12 10:49:09.196	1	2	0	0
104	1	wc2026-a01	墨西哥	南非	\N	\N	2026-06-11 19:00:00	FINISHED	2	0	2026-06-11 12:34:51.6	2026-06-11 12:34:44.124	2026-06-12 10:49:09.2	0	2	0	1
110	1	wc2026-b01	加拿大	波黑	\N	\N	2026-06-12 19:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.057	2026-06-11 12:34:44.158	2026-06-12 10:53:25.063	\N	\N	\N	\N
122	1	wc2026-d01	美国	巴拉圭	\N	\N	2026-06-13 01:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.082	2026-06-11 12:34:44.199	2026-06-12 10:53:25.082	\N	\N	\N	\N
116	1	wc2026-c01	巴西	摩洛哥	\N	\N	2026-06-13 22:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.094	2026-06-11 12:34:44.182	2026-06-12 10:53:25.094	\N	\N	\N	\N
117	1	wc2026-c02	海地	苏格兰	\N	\N	2026-06-14 01:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.101	2026-06-11 12:34:44.185	2026-06-12 10:53:25.101	\N	\N	\N	\N
123	1	wc2026-d02	澳大利亚	土耳其	\N	\N	2026-06-14 04:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.105	2026-06-11 12:34:44.202	2026-06-12 10:53:25.105	\N	\N	\N	\N
159	1	wc2026-j02	奥地利	约旦	\N	\N	2026-06-17 04:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.163	2026-06-11 12:34:44.288	2026-06-12 10:53:25.163	\N	\N	\N	\N
164	1	wc2026-k01	葡萄牙	刚果（金）	\N	\N	2026-06-17 17:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.166	2026-06-11 12:34:44.298	2026-06-12 10:53:25.166	\N	\N	\N	\N
170	1	wc2026-l01	英格兰	克罗地亚	\N	\N	2026-06-17 20:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.17	2026-06-11 12:34:44.31	2026-06-12 10:53:25.17	\N	\N	\N	\N
171	1	wc2026-l02	加纳	巴拿马	\N	\N	2026-06-17 23:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.174	2026-06-11 12:34:44.312	2026-06-12 10:53:25.174	\N	\N	\N	\N
165	1	wc2026-k02	乌兹别克斯坦	哥伦比亚	\N	\N	2026-06-18 02:00:00	UPCOMING	\N	\N	2026-06-12 10:53:25.177	2026-06-11 12:34:44.3	2026-06-12 10:53:25.177	\N	\N	\N	\N
111	1	wc2026-b02	卡塔尔	瑞士	\N	\N	2026-06-13 19:00:00	FINISHED	0	2	2026-06-12 10:53:39.054	2026-06-11 12:34:44.161	2026-06-12 10:56:22.752	2	0	0	0
\.


--
-- Data for Name: odds; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.odds (id, "matchId", "betType", "optionKey", "oddsValue", "updatedAt") FROM stdin;
15102	110	X1X	home	1.61	2026-06-12 10:53:25.076
15103	110	X1X	draw	3.36	2026-06-12 10:53:25.076
15104	110	X1X	away	4.75	2026-06-12 10:53:25.076
15105	110	HANDICAP_X1X	-1:home	3.50	2026-06-12 10:53:25.076
15106	110	HANDICAP_X1X	-1:draw	2.93	2026-06-12 10:53:25.076
15107	110	HANDICAP_X1X	-1:away	1.99	2026-06-12 10:53:25.076
15108	110	TOTAL_GOALS	0球	9.50	2026-06-12 10:53:25.076
15109	110	TOTAL_GOALS	1球	4.05	2026-06-12 10:53:25.076
15110	110	TOTAL_GOALS	2球	2.85	2026-06-12 10:53:25.076
15111	110	TOTAL_GOALS	3球	3.50	2026-06-12 10:53:25.076
15112	110	TOTAL_GOALS	4球	7.00	2026-06-12 10:53:25.076
15113	110	TOTAL_GOALS	5球	15.00	2026-06-12 10:53:25.076
15114	110	TOTAL_GOALS	6球	28.00	2026-06-12 10:53:25.076
15115	110	TOTAL_GOALS	7+	48.00	2026-06-12 10:53:25.076
15116	110	CORRECT_SCORE	1:0	5.10	2026-06-12 10:53:25.076
15117	110	CORRECT_SCORE	2:0	6.50	2026-06-12 10:53:25.076
15118	110	CORRECT_SCORE	2:1	5.30	2026-06-12 10:53:25.076
15119	110	CORRECT_SCORE	3:0	15.50	2026-06-12 10:53:25.076
15120	110	CORRECT_SCORE	3:1	15.00	2026-06-12 10:53:25.076
15121	110	CORRECT_SCORE	3:2	40.00	2026-06-12 10:53:25.076
15122	110	CORRECT_SCORE	4:0	40.00	2026-06-12 10:53:25.076
15123	110	CORRECT_SCORE	4:1	46.00	2026-06-12 10:53:25.076
15124	110	CORRECT_SCORE	4:2	95.00	2026-06-12 10:53:25.076
15125	110	CORRECT_SCORE	5:0	125.00	2026-06-12 10:53:25.076
15126	110	CORRECT_SCORE	5:1	150.00	2026-06-12 10:53:25.076
15127	110	CORRECT_SCORE	5:2	250.00	2026-06-12 10:53:25.076
4748	106	X1X	home	2.06	2026-06-11 12:34:44.142
4749	106	X1X	draw	3.12	2026-06-11 12:34:44.142
4750	106	X1X	away	3.49	2026-06-11 12:34:44.142
4751	106	TOTAL_GOALS	0球	9.26	2026-06-11 12:34:44.142
4752	106	TOTAL_GOALS	1球	4.49	2026-06-11 12:34:44.142
4753	106	TOTAL_GOALS	2球	3.59	2026-06-11 12:34:44.142
4754	106	TOTAL_GOALS	3球+	2.27	2026-06-11 12:34:44.142
4755	106	CORRECT_SCORE	1:0	7.59	2026-06-11 12:34:44.142
4756	106	CORRECT_SCORE	1:1	6.32	2026-06-11 12:34:44.142
4757	106	CORRECT_SCORE	2:0	8.47	2026-06-11 12:34:44.142
4758	106	CORRECT_SCORE	2:1	7.88	2026-06-11 12:34:44.142
4759	106	CORRECT_SCORE	0:1	9.96	2026-06-11 12:34:44.142
4760	106	CORRECT_SCORE	0:0	8.24	2026-06-11 12:34:44.142
4761	107	X1X	home	2.31	2026-06-11 12:34:44.146
4762	107	X1X	draw	3.50	2026-06-11 12:34:44.146
4763	107	X1X	away	2.62	2026-06-11 12:34:44.146
4764	107	TOTAL_GOALS	0球	9.35	2026-06-11 12:34:44.146
4765	107	TOTAL_GOALS	1球	4.50	2026-06-11 12:34:44.146
4766	107	TOTAL_GOALS	2球	3.42	2026-06-11 12:34:44.146
4767	107	TOTAL_GOALS	3球+	1.94	2026-06-11 12:34:44.146
4768	107	CORRECT_SCORE	1:0	7.88	2026-06-11 12:34:44.146
4769	107	CORRECT_SCORE	1:1	5.23	2026-06-11 12:34:44.146
4770	107	CORRECT_SCORE	2:0	10.00	2026-06-11 12:34:44.146
4771	107	CORRECT_SCORE	2:1	7.95	2026-06-11 12:34:44.146
4772	107	CORRECT_SCORE	0:1	8.91	2026-06-11 12:34:44.146
4773	107	CORRECT_SCORE	0:0	8.26	2026-06-11 12:34:44.146
4774	108	X1X	home	2.82	2026-06-11 12:34:44.151
4775	108	X1X	draw	3.44	2026-06-11 12:34:44.151
4776	108	X1X	away	2.58	2026-06-11 12:34:44.151
4777	108	TOTAL_GOALS	0球	8.48	2026-06-11 12:34:44.151
4778	108	TOTAL_GOALS	1球	4.27	2026-06-11 12:34:44.151
4779	108	TOTAL_GOALS	2球	3.03	2026-06-11 12:34:44.151
4780	108	TOTAL_GOALS	3球+	2.52	2026-06-11 12:34:44.151
4781	108	CORRECT_SCORE	1:0	6.78	2026-06-11 12:34:44.151
4782	108	CORRECT_SCORE	1:1	5.85	2026-06-11 12:34:44.151
4783	108	CORRECT_SCORE	2:0	8.21	2026-06-11 12:34:44.151
4784	108	CORRECT_SCORE	2:1	7.54	2026-06-11 12:34:44.151
4785	108	CORRECT_SCORE	0:1	7.89	2026-06-11 12:34:44.151
4786	108	CORRECT_SCORE	0:0	8.84	2026-06-11 12:34:44.151
4787	109	X1X	home	3.42	2026-06-11 12:34:44.156
4788	109	X1X	draw	3.45	2026-06-11 12:34:44.156
4789	109	X1X	away	2.19	2026-06-11 12:34:44.156
4790	109	TOTAL_GOALS	0球	9.81	2026-06-11 12:34:44.156
4791	109	TOTAL_GOALS	1球	4.94	2026-06-11 12:34:44.156
4792	109	TOTAL_GOALS	2球	3.03	2026-06-11 12:34:44.156
4793	109	TOTAL_GOALS	3球+	1.88	2026-06-11 12:34:44.156
4794	109	CORRECT_SCORE	1:0	7.89	2026-06-11 12:34:44.156
4795	109	CORRECT_SCORE	1:1	5.96	2026-06-11 12:34:44.156
4796	109	CORRECT_SCORE	2:0	8.88	2026-06-11 12:34:44.156
4797	109	CORRECT_SCORE	2:1	7.50	2026-06-11 12:34:44.156
4798	109	CORRECT_SCORE	0:1	9.09	2026-06-11 12:34:44.156
4799	109	CORRECT_SCORE	0:0	7.88	2026-06-11 12:34:44.156
15128	110	CORRECT_SCORE	胜其它	110.00	2026-06-12 10:53:25.076
15129	110	CORRECT_SCORE	0:0	9.50	2026-06-12 10:53:25.076
15130	110	CORRECT_SCORE	1:1	5.00	2026-06-12 10:53:25.076
15131	110	CORRECT_SCORE	2:2	18.50	2026-06-12 10:53:25.076
15132	110	CORRECT_SCORE	3:3	90.00	2026-06-12 10:53:25.076
15133	110	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:25.076
15134	110	CORRECT_SCORE	0:1	11.00	2026-06-12 10:53:25.076
15135	110	CORRECT_SCORE	0:2	28.00	2026-06-12 10:53:25.076
15136	110	CORRECT_SCORE	1:2	14.00	2026-06-12 10:53:25.076
15137	110	CORRECT_SCORE	0:3	95.00	2026-06-12 10:53:25.076
15138	110	CORRECT_SCORE	1:3	55.00	2026-06-12 10:53:25.076
15139	110	CORRECT_SCORE	2:3	70.00	2026-06-12 10:53:25.076
15140	110	CORRECT_SCORE	0:4	400.00	2026-06-12 10:53:25.076
15141	110	CORRECT_SCORE	1:4	300.00	2026-06-12 10:53:25.076
15142	110	CORRECT_SCORE	2:4	350.00	2026-06-12 10:53:25.076
15143	110	CORRECT_SCORE	0:5	600.00	2026-06-12 10:53:25.076
15144	110	CORRECT_SCORE	1:5	500.00	2026-06-12 10:53:25.076
15145	110	CORRECT_SCORE	2:5	600.00	2026-06-12 10:53:25.076
15146	110	CORRECT_SCORE	负其它	450.00	2026-06-12 10:53:25.076
15147	110	HALF_FULL	胜胜	2.65	2026-06-12 10:53:25.076
15148	110	HALF_FULL	胜平	13.50	2026-06-12 10:53:25.076
15149	110	HALF_FULL	胜负	34.00	2026-06-12 10:53:25.076
15150	110	HALF_FULL	平胜	4.15	2026-06-12 10:53:25.076
15151	110	HALF_FULL	平平	4.85	2026-06-12 10:53:25.076
15152	110	HALF_FULL	平负	10.00	2026-06-12 10:53:25.076
15153	110	HALF_FULL	负胜	25.00	2026-06-12 10:53:25.076
4826	112	X1X	home	2.64	2026-06-11 12:34:44.169
4827	112	X1X	draw	3.64	2026-06-11 12:34:44.169
4828	112	X1X	away	3.25	2026-06-11 12:34:44.169
4829	112	TOTAL_GOALS	0球	8.17	2026-06-11 12:34:44.169
4830	112	TOTAL_GOALS	1球	4.63	2026-06-11 12:34:44.169
4831	112	TOTAL_GOALS	2球	3.02	2026-06-11 12:34:44.169
4832	112	TOTAL_GOALS	3球+	2.01	2026-06-11 12:34:44.169
4833	112	CORRECT_SCORE	1:0	6.53	2026-06-11 12:34:44.169
4834	112	CORRECT_SCORE	1:1	5.25	2026-06-11 12:34:44.169
4835	112	CORRECT_SCORE	2:0	8.47	2026-06-11 12:34:44.169
4836	112	CORRECT_SCORE	2:1	7.68	2026-06-11 12:34:44.169
15154	110	HALF_FULL	负平	13.50	2026-06-12 10:53:25.076
15155	110	HALF_FULL	负负	8.90	2026-06-12 10:53:25.076
15156	122	X1X	home	1.79	2026-06-12 10:53:25.086
15157	122	X1X	draw	3.25	2026-06-12 10:53:25.086
15158	122	X1X	away	3.80	2026-06-12 10:53:25.086
15159	122	HANDICAP_X1X	-1:home	4.02	2026-06-12 10:53:25.086
15160	122	HANDICAP_X1X	-1:draw	3.08	2026-06-12 10:53:25.086
15161	122	HANDICAP_X1X	-1:away	1.80	2026-06-12 10:53:25.086
15162	122	TOTAL_GOALS	0球	9.00	2026-06-12 10:53:25.086
15163	122	TOTAL_GOALS	1球	4.15	2026-06-12 10:53:25.086
15164	122	TOTAL_GOALS	2球	2.90	2026-06-12 10:53:25.086
15165	122	TOTAL_GOALS	3球	3.50	2026-06-12 10:53:25.086
15166	122	TOTAL_GOALS	4球	7.00	2026-06-12 10:53:25.086
15167	122	TOTAL_GOALS	5球	15.50	2026-06-12 10:53:25.086
15168	122	TOTAL_GOALS	6球	29.00	2026-06-12 10:53:25.086
15169	122	TOTAL_GOALS	7+	35.00	2026-06-12 10:53:25.086
4837	112	CORRECT_SCORE	0:1	7.52	2026-06-11 12:34:44.169
4838	112	CORRECT_SCORE	0:0	7.48	2026-06-11 12:34:44.169
15170	122	CORRECT_SCORE	1:0	5.80	2026-06-12 10:53:25.086
15171	122	CORRECT_SCORE	2:0	6.00	2026-06-12 10:53:25.086
15172	122	CORRECT_SCORE	2:1	4.75	2026-06-12 10:53:25.086
15173	122	CORRECT_SCORE	3:0	17.50	2026-06-12 10:53:25.086
15174	122	CORRECT_SCORE	3:1	14.00	2026-06-12 10:53:25.086
15175	122	CORRECT_SCORE	3:2	43.00	2026-06-12 10:53:25.086
15176	122	CORRECT_SCORE	4:0	70.00	2026-06-12 10:53:25.086
15177	122	CORRECT_SCORE	4:1	65.00	2026-06-12 10:53:25.086
15178	122	CORRECT_SCORE	4:2	100.00	2026-06-12 10:53:25.086
15179	122	CORRECT_SCORE	5:0	175.00	2026-06-12 10:53:25.086
15180	122	CORRECT_SCORE	5:1	150.00	2026-06-12 10:53:25.086
15181	122	CORRECT_SCORE	5:2	300.00	2026-06-12 10:53:25.086
15182	122	CORRECT_SCORE	胜其它	125.00	2026-06-12 10:53:25.086
15183	122	CORRECT_SCORE	0:0	9.00	2026-06-12 10:53:25.086
15184	122	CORRECT_SCORE	1:1	5.35	2026-06-12 10:53:25.086
15185	122	CORRECT_SCORE	2:2	18.00	2026-06-12 10:53:25.086
15186	122	CORRECT_SCORE	3:3	90.00	2026-06-12 10:53:25.086
15187	122	CORRECT_SCORE	平其它	400.00	2026-06-12 10:53:25.086
15188	122	CORRECT_SCORE	0:1	10.50	2026-06-12 10:53:25.086
15189	122	CORRECT_SCORE	0:2	23.00	2026-06-12 10:53:25.086
15190	122	CORRECT_SCORE	1:2	16.00	2026-06-12 10:53:25.086
15191	122	CORRECT_SCORE	0:3	70.00	2026-06-12 10:53:25.086
15192	122	CORRECT_SCORE	1:3	48.00	2026-06-12 10:53:25.086
15193	122	CORRECT_SCORE	2:3	65.00	2026-06-12 10:53:25.086
15194	122	CORRECT_SCORE	0:4	200.00	2026-06-12 10:53:25.086
15195	122	CORRECT_SCORE	1:4	175.00	2026-06-12 10:53:25.086
15196	122	CORRECT_SCORE	2:4	200.00	2026-06-12 10:53:25.086
15197	122	CORRECT_SCORE	0:5	500.00	2026-06-12 10:53:25.086
15198	122	CORRECT_SCORE	1:5	500.00	2026-06-12 10:53:25.086
15199	122	CORRECT_SCORE	2:5	600.00	2026-06-12 10:53:25.086
15200	122	CORRECT_SCORE	负其它	300.00	2026-06-12 10:53:25.086
15201	122	HALF_FULL	胜胜	2.80	2026-06-12 10:53:25.086
15202	122	HALF_FULL	胜平	13.50	2026-06-12 10:53:25.086
15203	122	HALF_FULL	胜负	33.00	2026-06-12 10:53:25.086
15204	122	HALF_FULL	平胜	4.30	2026-06-12 10:53:25.086
15205	122	HALF_FULL	平平	5.25	2026-06-12 10:53:25.086
15206	122	HALF_FULL	平负	8.90	2026-06-12 10:53:25.086
15207	122	HALF_FULL	负胜	25.00	2026-06-12 10:53:25.086
15208	122	HALF_FULL	负平	13.50	2026-06-12 10:53:25.086
15209	122	HALF_FULL	负负	7.00	2026-06-12 10:53:25.086
15261	116	X1X	home	1.51	2026-06-12 10:53:25.097
15262	116	X1X	draw	3.55	2026-06-12 10:53:25.097
15263	116	X1X	away	5.40	2026-06-12 10:53:25.097
15264	116	HANDICAP_X1X	-1:home	2.70	2026-06-12 10:53:25.097
15265	116	HANDICAP_X1X	-1:draw	3.26	2026-06-12 10:53:25.097
15266	116	HANDICAP_X1X	-1:away	2.21	2026-06-12 10:53:25.097
15267	116	TOTAL_GOALS	0球	10.00	2026-06-12 10:53:25.097
15268	116	TOTAL_GOALS	1球	4.40	2026-06-12 10:53:25.097
15269	116	TOTAL_GOALS	2球	3.20	2026-06-12 10:53:25.097
15270	116	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.097
15271	116	TOTAL_GOALS	4球	5.90	2026-06-12 10:53:25.097
15272	116	TOTAL_GOALS	5球	12.00	2026-06-12 10:53:25.097
15273	116	TOTAL_GOALS	6球	21.00	2026-06-12 10:53:25.097
15274	116	TOTAL_GOALS	7+	28.00	2026-06-12 10:53:25.097
15275	116	CORRECT_SCORE	1:0	5.85	2026-06-12 10:53:25.097
15276	116	CORRECT_SCORE	2:0	6.50	2026-06-12 10:53:25.097
15277	116	CORRECT_SCORE	2:1	6.80	2026-06-12 10:53:25.097
15278	116	CORRECT_SCORE	3:0	11.00	2026-06-12 10:53:25.097
15279	116	CORRECT_SCORE	3:1	11.00	2026-06-12 10:53:25.097
15280	116	CORRECT_SCORE	3:2	29.00	2026-06-12 10:53:25.097
15281	116	CORRECT_SCORE	4:0	27.00	2026-06-12 10:53:25.097
15282	116	CORRECT_SCORE	4:1	30.00	2026-06-12 10:53:25.097
15283	116	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.097
15284	116	CORRECT_SCORE	5:0	75.00	2026-06-12 10:53:25.097
15285	116	CORRECT_SCORE	5:1	90.00	2026-06-12 10:53:25.097
15286	116	CORRECT_SCORE	5:2	200.00	2026-06-12 10:53:25.097
15287	116	CORRECT_SCORE	胜其它	60.00	2026-06-12 10:53:25.097
15288	116	CORRECT_SCORE	0:0	10.00	2026-06-12 10:53:25.097
15289	116	CORRECT_SCORE	1:1	6.00	2026-06-12 10:53:25.097
15290	116	CORRECT_SCORE	2:2	16.00	2026-06-12 10:53:25.097
15291	116	CORRECT_SCORE	3:3	85.00	2026-06-12 10:53:25.097
15292	116	CORRECT_SCORE	平其它	400.00	2026-06-12 10:53:25.097
15293	116	CORRECT_SCORE	0:1	12.50	2026-06-12 10:53:25.097
15294	116	CORRECT_SCORE	0:2	29.00	2026-06-12 10:53:25.097
15295	116	CORRECT_SCORE	1:2	14.00	2026-06-12 10:53:25.097
15296	116	CORRECT_SCORE	0:3	95.00	2026-06-12 10:53:25.097
15297	116	CORRECT_SCORE	1:3	62.00	2026-06-12 10:53:25.097
15298	116	CORRECT_SCORE	2:3	62.00	2026-06-12 10:53:25.097
15299	116	CORRECT_SCORE	0:4	300.00	2026-06-12 10:53:25.097
15300	116	CORRECT_SCORE	1:4	300.00	2026-06-12 10:53:25.097
15301	116	CORRECT_SCORE	2:4	300.00	2026-06-12 10:53:25.097
15302	116	CORRECT_SCORE	0:5	600.00	2026-06-12 10:53:25.097
15303	116	CORRECT_SCORE	1:5	500.00	2026-06-12 10:53:25.097
15304	116	CORRECT_SCORE	2:5	600.00	2026-06-12 10:53:25.097
15305	116	CORRECT_SCORE	负其它	250.00	2026-06-12 10:53:25.097
15306	116	HALF_FULL	胜胜	2.35	2026-06-12 10:53:25.097
15307	116	HALF_FULL	胜平	17.00	2026-06-12 10:53:25.097
15308	116	HALF_FULL	胜负	40.00	2026-06-12 10:53:25.097
15309	116	HALF_FULL	平胜	4.00	2026-06-12 10:53:25.097
15310	116	HALF_FULL	平平	5.10	2026-06-12 10:53:25.097
15311	116	HALF_FULL	平负	11.00	2026-06-12 10:53:25.097
15312	116	HALF_FULL	负胜	24.00	2026-06-12 10:53:25.097
15313	116	HALF_FULL	负平	17.00	2026-06-12 10:53:25.097
15314	116	HALF_FULL	负负	9.25	2026-06-12 10:53:25.097
15315	117	X1X	home	7.40	2026-06-12 10:53:25.103
15316	117	X1X	draw	4.12	2026-06-12 10:53:25.103
15317	117	X1X	away	1.33	2026-06-12 10:53:25.103
15318	117	HANDICAP_X1X	1:home	2.71	2026-06-12 10:53:25.103
15319	117	HANDICAP_X1X	1:draw	3.40	2026-06-12 10:53:25.103
15320	117	HANDICAP_X1X	1:away	2.15	2026-06-12 10:53:25.103
15321	117	TOTAL_GOALS	0球	11.00	2026-06-12 10:53:25.103
15322	117	TOTAL_GOALS	1球	4.40	2026-06-12 10:53:25.103
15323	117	TOTAL_GOALS	2球	3.35	2026-06-12 10:53:25.103
15324	117	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.103
15325	117	TOTAL_GOALS	4球	5.60	2026-06-12 10:53:25.103
15326	117	TOTAL_GOALS	5球	10.50	2026-06-12 10:53:25.103
15327	117	TOTAL_GOALS	6球	19.00	2026-06-12 10:53:25.103
15328	117	TOTAL_GOALS	7+	30.00	2026-06-12 10:53:25.103
15329	117	CORRECT_SCORE	1:0	15.00	2026-06-12 10:53:25.103
15330	117	CORRECT_SCORE	2:0	50.00	2026-06-12 10:53:25.103
15331	117	CORRECT_SCORE	2:1	21.00	2026-06-12 10:53:25.103
15332	117	CORRECT_SCORE	3:0	200.00	2026-06-12 10:53:25.103
15333	117	CORRECT_SCORE	3:1	90.00	2026-06-12 10:53:25.103
15334	117	CORRECT_SCORE	3:2	100.00	2026-06-12 10:53:25.103
15335	117	CORRECT_SCORE	4:0	700.00	2026-06-12 10:53:25.103
15336	117	CORRECT_SCORE	4:1	450.00	2026-06-12 10:53:25.103
15337	117	CORRECT_SCORE	4:2	450.00	2026-06-12 10:53:25.103
15338	117	CORRECT_SCORE	5:0	1000.00	2026-06-12 10:53:25.103
15339	117	CORRECT_SCORE	5:1	1000.00	2026-06-12 10:53:25.103
15340	117	CORRECT_SCORE	5:2	1000.00	2026-06-12 10:53:25.103
15341	117	CORRECT_SCORE	胜其它	450.00	2026-06-12 10:53:25.103
15342	117	CORRECT_SCORE	0:0	11.00	2026-06-12 10:53:25.103
15343	117	CORRECT_SCORE	1:1	7.50	2026-06-12 10:53:25.103
15344	117	CORRECT_SCORE	2:2	20.00	2026-06-12 10:53:25.103
15345	117	CORRECT_SCORE	3:3	120.00	2026-06-12 10:53:25.103
15346	117	CORRECT_SCORE	平其它	600.00	2026-06-12 10:53:25.103
15347	117	CORRECT_SCORE	0:1	5.40	2026-06-12 10:53:25.103
15348	117	CORRECT_SCORE	0:2	5.50	2026-06-12 10:53:25.103
15349	117	CORRECT_SCORE	1:2	7.00	2026-06-12 10:53:25.103
15350	117	CORRECT_SCORE	0:3	8.00	2026-06-12 10:53:25.103
15351	117	CORRECT_SCORE	1:3	11.00	2026-06-12 10:53:25.103
15352	117	CORRECT_SCORE	2:3	32.00	2026-06-12 10:53:25.103
15353	117	CORRECT_SCORE	0:4	16.00	2026-06-12 10:53:25.103
15354	117	CORRECT_SCORE	1:4	23.00	2026-06-12 10:53:25.103
15355	117	CORRECT_SCORE	2:4	75.00	2026-06-12 10:53:25.103
15356	117	CORRECT_SCORE	0:5	40.00	2026-06-12 10:53:25.103
15357	117	CORRECT_SCORE	1:5	60.00	2026-06-12 10:53:25.103
15358	117	CORRECT_SCORE	2:5	150.00	2026-06-12 10:53:25.103
15359	117	CORRECT_SCORE	负其它	35.00	2026-06-12 10:53:25.103
15360	117	HALF_FULL	胜胜	13.00	2026-06-12 10:53:25.103
15361	117	HALF_FULL	胜平	21.00	2026-06-12 10:53:25.103
15362	117	HALF_FULL	胜负	29.00	2026-06-12 10:53:25.103
15363	117	HALF_FULL	平胜	16.00	2026-06-12 10:53:25.103
15364	117	HALF_FULL	平平	6.05	2026-06-12 10:53:25.103
15365	117	HALF_FULL	平负	3.70	2026-06-12 10:53:25.103
15366	117	HALF_FULL	负胜	60.00	2026-06-12 10:53:25.103
15367	117	HALF_FULL	负平	21.00	2026-06-12 10:53:25.103
15368	117	HALF_FULL	负负	1.88	2026-06-12 10:53:25.103
15369	123	X1X	home	5.15	2026-06-12 10:53:25.108
15370	123	X1X	draw	3.45	2026-06-12 10:53:25.108
15371	123	X1X	away	1.55	2026-06-12 10:53:25.108
15372	123	HANDICAP_X1X	1:home	2.11	2026-06-12 10:53:25.108
15373	123	HANDICAP_X1X	1:draw	3.25	2026-06-12 10:53:25.108
15374	123	HANDICAP_X1X	1:away	2.88	2026-06-12 10:53:25.108
15375	123	TOTAL_GOALS	0球	9.50	2026-06-12 10:53:25.108
15376	123	TOTAL_GOALS	1球	4.20	2026-06-12 10:53:25.108
15377	123	TOTAL_GOALS	2球	3.25	2026-06-12 10:53:25.108
15378	123	TOTAL_GOALS	3球	3.65	2026-06-12 10:53:25.108
15379	123	TOTAL_GOALS	4球	6.00	2026-06-12 10:53:25.108
15380	123	TOTAL_GOALS	5球	12.00	2026-06-12 10:53:25.108
15381	123	TOTAL_GOALS	6球	21.00	2026-06-12 10:53:25.108
15382	123	TOTAL_GOALS	7+	32.00	2026-06-12 10:53:25.108
15383	123	CORRECT_SCORE	1:0	11.50	2026-06-12 10:53:25.108
15384	123	CORRECT_SCORE	2:0	28.00	2026-06-12 10:53:25.108
15385	123	CORRECT_SCORE	2:1	14.00	2026-06-12 10:53:25.108
15386	123	CORRECT_SCORE	3:0	90.00	2026-06-12 10:53:25.108
15387	123	CORRECT_SCORE	3:1	52.00	2026-06-12 10:53:25.108
15388	123	CORRECT_SCORE	3:2	63.00	2026-06-12 10:53:25.108
15389	123	CORRECT_SCORE	4:0	300.00	2026-06-12 10:53:25.108
15390	123	CORRECT_SCORE	4:1	250.00	2026-06-12 10:53:25.108
15391	123	CORRECT_SCORE	4:2	300.00	2026-06-12 10:53:25.108
15392	123	CORRECT_SCORE	5:0	900.00	2026-06-12 10:53:25.108
15393	123	CORRECT_SCORE	5:1	700.00	2026-06-12 10:53:25.108
15394	123	CORRECT_SCORE	5:2	800.00	2026-06-12 10:53:25.108
15395	123	CORRECT_SCORE	胜其它	300.00	2026-06-12 10:53:25.108
15396	123	CORRECT_SCORE	0:0	9.50	2026-06-12 10:53:25.108
15397	123	CORRECT_SCORE	1:1	6.20	2026-06-12 10:53:25.108
15398	123	CORRECT_SCORE	2:2	16.00	2026-06-12 10:53:25.108
15399	123	CORRECT_SCORE	3:3	100.00	2026-06-12 10:53:25.108
15400	123	CORRECT_SCORE	平其它	600.00	2026-06-12 10:53:25.108
15401	123	CORRECT_SCORE	0:1	5.70	2026-06-12 10:53:25.108
15402	123	CORRECT_SCORE	0:2	6.50	2026-06-12 10:53:25.108
15403	123	CORRECT_SCORE	1:2	6.80	2026-06-12 10:53:25.108
15404	123	CORRECT_SCORE	0:3	11.50	2026-06-12 10:53:25.108
15405	123	CORRECT_SCORE	1:3	12.00	2026-06-12 10:53:25.108
15406	123	CORRECT_SCORE	2:3	29.00	2026-06-12 10:53:25.108
15407	123	CORRECT_SCORE	0:4	27.00	2026-06-12 10:53:25.108
15408	123	CORRECT_SCORE	1:4	30.00	2026-06-12 10:53:25.108
15409	123	CORRECT_SCORE	2:4	75.00	2026-06-12 10:53:25.108
15410	123	CORRECT_SCORE	0:5	75.00	2026-06-12 10:53:25.108
15411	123	CORRECT_SCORE	1:5	90.00	2026-06-12 10:53:25.108
15412	123	CORRECT_SCORE	2:5	200.00	2026-06-12 10:53:25.108
15413	123	CORRECT_SCORE	负其它	60.00	2026-06-12 10:53:25.108
15414	123	HALF_FULL	胜胜	8.50	2026-06-12 10:53:25.108
15415	123	HALF_FULL	胜平	18.00	2026-06-12 10:53:25.108
15416	123	HALF_FULL	胜负	26.00	2026-06-12 10:53:25.108
15417	123	HALF_FULL	平胜	10.50	2026-06-12 10:53:25.108
15418	123	HALF_FULL	平平	5.00	2026-06-12 10:53:25.108
15419	123	HALF_FULL	平负	4.10	2026-06-12 10:53:25.108
15420	123	HALF_FULL	负胜	45.00	2026-06-12 10:53:25.108
15421	123	HALF_FULL	负平	18.00	2026-06-12 10:53:25.108
15422	123	HALF_FULL	负负	2.35	2026-06-12 10:53:25.108
15423	128	HANDICAP_X1X	-3:home	1.90	2026-06-12 10:53:25.113
15424	128	HANDICAP_X1X	-3:draw	4.60	2026-06-12 10:53:25.113
15425	128	HANDICAP_X1X	-3:away	2.59	2026-06-12 10:53:25.113
15426	128	TOTAL_GOALS	0球	55.00	2026-06-12 10:53:25.113
15427	128	TOTAL_GOALS	1球	13.50	2026-06-12 10:53:25.113
15428	128	TOTAL_GOALS	2球	6.70	2026-06-12 10:53:25.113
15429	128	TOTAL_GOALS	3球	4.35	2026-06-12 10:53:25.113
15430	128	TOTAL_GOALS	4球	4.20	2026-06-12 10:53:25.113
15431	128	TOTAL_GOALS	5球	4.80	2026-06-12 10:53:25.113
15432	128	TOTAL_GOALS	6球	6.50	2026-06-12 10:53:25.113
15433	128	TOTAL_GOALS	7+	5.50	2026-06-12 10:53:25.113
15434	128	CORRECT_SCORE	1:0	14.00	2026-06-12 10:53:25.113
15435	128	CORRECT_SCORE	2:0	7.25	2026-06-12 10:53:25.113
15436	128	CORRECT_SCORE	2:1	15.00	2026-06-12 10:53:25.113
15437	128	CORRECT_SCORE	3:0	5.50	2026-06-12 10:53:25.113
15438	128	CORRECT_SCORE	3:1	13.00	2026-06-12 10:53:25.113
15439	128	CORRECT_SCORE	3:2	60.00	2026-06-12 10:53:25.113
15440	128	CORRECT_SCORE	4:0	5.75	2026-06-12 10:53:25.113
15441	128	CORRECT_SCORE	4:1	14.00	2026-06-12 10:53:25.113
15442	128	CORRECT_SCORE	4:2	60.00	2026-06-12 10:53:25.113
15443	128	CORRECT_SCORE	5:0	7.00	2026-06-12 10:53:25.113
15444	128	CORRECT_SCORE	5:1	18.00	2026-06-12 10:53:25.113
15445	128	CORRECT_SCORE	5:2	65.00	2026-06-12 10:53:25.113
15446	128	CORRECT_SCORE	胜其它	3.75	2026-06-12 10:53:25.113
15447	128	CORRECT_SCORE	0:0	55.00	2026-06-12 10:53:25.113
15448	128	CORRECT_SCORE	1:1	27.00	2026-06-12 10:53:25.113
15449	128	CORRECT_SCORE	2:2	50.00	2026-06-12 10:53:25.113
15450	128	CORRECT_SCORE	3:3	200.00	2026-06-12 10:53:25.113
15451	128	CORRECT_SCORE	平其它	900.00	2026-06-12 10:53:25.113
15452	128	CORRECT_SCORE	0:1	100.00	2026-06-12 10:53:25.113
15453	128	CORRECT_SCORE	0:2	350.00	2026-06-12 10:53:25.113
15454	128	CORRECT_SCORE	1:2	110.00	2026-06-12 10:53:25.113
15455	128	CORRECT_SCORE	0:3	900.00	2026-06-12 10:53:25.113
15456	128	CORRECT_SCORE	1:3	600.00	2026-06-12 10:53:25.113
15457	128	CORRECT_SCORE	2:3	400.00	2026-06-12 10:53:25.113
15458	128	CORRECT_SCORE	0:4	1000.00	2026-06-12 10:53:25.113
15459	128	CORRECT_SCORE	1:4	1000.00	2026-06-12 10:53:25.113
15460	128	CORRECT_SCORE	2:4	1000.00	2026-06-12 10:53:25.113
15461	128	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.113
15462	128	CORRECT_SCORE	1:5	1000.00	2026-06-12 10:53:25.113
15463	128	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.113
15464	128	CORRECT_SCORE	负其它	900.00	2026-06-12 10:53:25.113
15465	134	X1X	home	1.78	2026-06-12 10:53:25.119
15466	134	X1X	draw	3.30	2026-06-12 10:53:25.119
15467	134	X1X	away	3.78	2026-06-12 10:53:25.119
15468	134	HANDICAP_X1X	-1:home	3.55	2026-06-12 10:53:25.119
15469	134	HANDICAP_X1X	-1:draw	3.50	2026-06-12 10:53:25.119
15470	134	HANDICAP_X1X	-1:away	1.78	2026-06-12 10:53:25.119
15471	134	TOTAL_GOALS	0球	10.00	2026-06-12 10:53:25.119
15472	134	TOTAL_GOALS	1球	4.30	2026-06-12 10:53:25.119
15473	134	TOTAL_GOALS	2球	3.30	2026-06-12 10:53:25.119
15474	134	TOTAL_GOALS	3球	3.65	2026-06-12 10:53:25.119
15475	134	TOTAL_GOALS	4球	5.80	2026-06-12 10:53:25.119
15476	134	TOTAL_GOALS	5球	11.00	2026-06-12 10:53:25.119
15477	134	TOTAL_GOALS	6球	20.00	2026-06-12 10:53:25.119
15478	134	TOTAL_GOALS	7+	32.00	2026-06-12 10:53:25.119
15479	134	CORRECT_SCORE	1:0	6.50	2026-06-12 10:53:25.119
15480	134	CORRECT_SCORE	2:0	7.50	2026-06-12 10:53:25.119
15481	134	CORRECT_SCORE	2:1	7.00	2026-06-12 10:53:25.119
15482	134	CORRECT_SCORE	3:0	14.00	2026-06-12 10:53:25.119
15483	134	CORRECT_SCORE	3:1	13.50	2026-06-12 10:53:25.119
15484	134	CORRECT_SCORE	3:2	27.00	2026-06-12 10:53:25.119
15485	134	CORRECT_SCORE	4:0	33.00	2026-06-12 10:53:25.119
15486	134	CORRECT_SCORE	4:1	34.00	2026-06-12 10:53:25.119
15487	134	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.119
15488	134	CORRECT_SCORE	5:0	95.00	2026-06-12 10:53:25.119
15489	134	CORRECT_SCORE	5:1	110.00	2026-06-12 10:53:25.119
15490	134	CORRECT_SCORE	5:2	220.00	2026-06-12 10:53:25.119
15491	134	CORRECT_SCORE	胜其它	60.00	2026-06-12 10:53:25.119
15492	134	CORRECT_SCORE	0:0	10.00	2026-06-12 10:53:25.119
15493	134	CORRECT_SCORE	1:1	6.00	2026-06-12 10:53:25.119
15494	134	CORRECT_SCORE	2:2	14.00	2026-06-12 10:53:25.119
15495	134	CORRECT_SCORE	3:3	65.00	2026-06-12 10:53:25.119
15496	134	CORRECT_SCORE	平其它	300.00	2026-06-12 10:53:25.119
15497	134	CORRECT_SCORE	0:1	10.50	2026-06-12 10:53:25.119
15498	134	CORRECT_SCORE	0:2	21.00	2026-06-12 10:53:25.119
15499	134	CORRECT_SCORE	1:2	11.50	2026-06-12 10:53:25.119
15500	134	CORRECT_SCORE	0:3	60.00	2026-06-12 10:53:25.119
15501	134	CORRECT_SCORE	1:3	40.00	2026-06-12 10:53:25.119
15502	134	CORRECT_SCORE	2:3	45.00	2026-06-12 10:53:25.119
15503	134	CORRECT_SCORE	0:4	200.00	2026-06-12 10:53:25.119
15504	134	CORRECT_SCORE	1:4	125.00	2026-06-12 10:53:25.119
15505	134	CORRECT_SCORE	2:4	150.00	2026-06-12 10:53:25.119
15506	134	CORRECT_SCORE	0:5	600.00	2026-06-12 10:53:25.119
15507	134	CORRECT_SCORE	1:5	400.00	2026-06-12 10:53:25.119
15508	134	CORRECT_SCORE	2:5	500.00	2026-06-12 10:53:25.119
15509	134	CORRECT_SCORE	负其它	175.00	2026-06-12 10:53:25.119
15510	134	HALF_FULL	胜胜	2.71	2026-06-12 10:53:25.119
15511	134	HALF_FULL	胜平	14.50	2026-06-12 10:53:25.119
15512	134	HALF_FULL	胜负	39.00	2026-06-12 10:53:25.119
15513	134	HALF_FULL	平胜	4.50	2026-06-12 10:53:25.119
15514	134	HALF_FULL	平平	5.10	2026-06-12 10:53:25.119
15515	134	HALF_FULL	平负	9.00	2026-06-12 10:53:25.119
15516	134	HALF_FULL	负胜	26.00	2026-06-12 10:53:25.119
15517	134	HALF_FULL	负平	14.50	2026-06-12 10:53:25.119
15518	134	HALF_FULL	负负	6.50	2026-06-12 10:53:25.119
15519	129	X1X	home	3.36	2026-06-12 10:53:25.128
15520	129	X1X	draw	2.65	2026-06-12 10:53:25.128
15521	129	X1X	away	2.20	2026-06-12 10:53:25.128
15522	129	HANDICAP_X1X	1:home	1.51	2026-06-12 10:53:25.128
15523	129	HANDICAP_X1X	1:draw	3.60	2026-06-12 10:53:25.128
15524	129	HANDICAP_X1X	1:away	5.30	2026-06-12 10:53:25.128
15525	129	TOTAL_GOALS	0球	6.00	2026-06-12 10:53:25.128
15526	129	TOTAL_GOALS	1球	3.20	2026-06-12 10:53:25.128
15527	129	TOTAL_GOALS	2球	3.00	2026-06-12 10:53:25.128
15528	129	TOTAL_GOALS	3球	4.35	2026-06-12 10:53:25.128
15529	129	TOTAL_GOALS	4球	8.50	2026-06-12 10:53:25.128
15530	129	TOTAL_GOALS	5球	21.00	2026-06-12 10:53:25.128
15531	129	TOTAL_GOALS	6球	35.00	2026-06-12 10:53:25.128
15532	129	TOTAL_GOALS	7+	55.00	2026-06-12 10:53:25.128
15533	129	CORRECT_SCORE	1:0	7.00	2026-06-12 10:53:25.128
15534	129	CORRECT_SCORE	2:0	14.50	2026-06-12 10:53:25.128
15535	129	CORRECT_SCORE	2:1	11.00	2026-06-12 10:53:25.128
15536	129	CORRECT_SCORE	3:0	50.00	2026-06-12 10:53:25.128
15537	129	CORRECT_SCORE	3:1	40.00	2026-06-12 10:53:25.128
15538	129	CORRECT_SCORE	3:2	60.00	2026-06-12 10:53:25.128
15539	129	CORRECT_SCORE	4:0	200.00	2026-06-12 10:53:25.128
15540	129	CORRECT_SCORE	4:1	175.00	2026-06-12 10:53:25.128
15541	129	CORRECT_SCORE	4:2	300.00	2026-06-12 10:53:25.128
15542	129	CORRECT_SCORE	5:0	600.00	2026-06-12 10:53:25.128
15543	129	CORRECT_SCORE	5:1	600.00	2026-06-12 10:53:25.128
15544	129	CORRECT_SCORE	5:2	700.00	2026-06-12 10:53:25.128
15545	129	CORRECT_SCORE	胜其它	400.00	2026-06-12 10:53:25.128
15546	129	CORRECT_SCORE	0:0	6.00	2026-06-12 10:53:25.128
15547	129	CORRECT_SCORE	1:1	5.00	2026-06-12 10:53:25.128
15548	129	CORRECT_SCORE	2:2	17.00	2026-06-12 10:53:25.128
15549	129	CORRECT_SCORE	3:3	130.00	2026-06-12 10:53:25.128
15550	129	CORRECT_SCORE	平其它	800.00	2026-06-12 10:53:25.128
15551	129	CORRECT_SCORE	0:1	5.20	2026-06-12 10:53:25.128
15552	129	CORRECT_SCORE	0:2	8.65	2026-06-12 10:53:25.128
15553	129	CORRECT_SCORE	1:2	8.25	2026-06-12 10:53:25.128
15554	129	CORRECT_SCORE	0:3	21.00	2026-06-12 10:53:25.128
15555	129	CORRECT_SCORE	1:3	22.00	2026-06-12 10:53:25.128
15556	129	CORRECT_SCORE	2:3	45.00	2026-06-12 10:53:25.128
15557	129	CORRECT_SCORE	0:4	75.00	2026-06-12 10:53:25.128
15558	129	CORRECT_SCORE	1:4	75.00	2026-06-12 10:53:25.128
15559	129	CORRECT_SCORE	2:4	175.00	2026-06-12 10:53:25.128
15560	129	CORRECT_SCORE	0:5	300.00	2026-06-12 10:53:25.128
15561	129	CORRECT_SCORE	1:5	300.00	2026-06-12 10:53:25.128
15562	129	CORRECT_SCORE	2:5	500.00	2026-06-12 10:53:25.128
15563	129	CORRECT_SCORE	负其它	250.00	2026-06-12 10:53:25.128
15564	129	HALF_FULL	胜胜	5.85	2026-06-12 10:53:25.128
15565	129	HALF_FULL	胜平	15.50	2026-06-12 10:53:25.128
15566	129	HALF_FULL	胜负	33.00	2026-06-12 10:53:25.128
15567	129	HALF_FULL	平胜	6.70	2026-06-12 10:53:25.128
15568	129	HALF_FULL	平平	3.60	2026-06-12 10:53:25.128
15569	129	HALF_FULL	平负	4.80	2026-06-12 10:53:25.128
15570	129	HALF_FULL	负胜	39.00	2026-06-12 10:53:25.128
15571	129	HALF_FULL	负平	15.50	2026-06-12 10:53:25.128
15572	129	HALF_FULL	负负	3.80	2026-06-12 10:53:25.128
15573	135	X1X	home	1.71	2026-06-12 10:53:25.132
15574	135	X1X	draw	3.15	2026-06-12 10:53:25.132
15575	135	X1X	away	4.40	2026-06-12 10:53:25.132
15576	135	HANDICAP_X1X	-1:home	3.45	2026-06-12 10:53:25.132
15577	135	HANDICAP_X1X	-1:draw	3.25	2026-06-12 10:53:25.132
15578	135	HANDICAP_X1X	-1:away	1.88	2026-06-12 10:53:25.132
15579	135	TOTAL_GOALS	0球	8.00	2026-06-12 10:53:25.132
15580	135	TOTAL_GOALS	1球	3.85	2026-06-12 10:53:25.132
15581	135	TOTAL_GOALS	2球	3.15	2026-06-12 10:53:25.132
15582	135	TOTAL_GOALS	3球	3.85	2026-06-12 10:53:25.132
15583	135	TOTAL_GOALS	4球	6.75	2026-06-12 10:53:25.132
15584	135	TOTAL_GOALS	5球	13.00	2026-06-12 10:53:25.132
15585	135	TOTAL_GOALS	6球	25.00	2026-06-12 10:53:25.132
15586	135	TOTAL_GOALS	7+	36.00	2026-06-12 10:53:25.132
15587	135	CORRECT_SCORE	1:0	5.60	2026-06-12 10:53:25.132
15588	135	CORRECT_SCORE	2:0	7.50	2026-06-12 10:53:25.132
15589	135	CORRECT_SCORE	2:1	7.00	2026-06-12 10:53:25.132
15590	135	CORRECT_SCORE	3:0	14.00	2026-06-12 10:53:25.132
15591	135	CORRECT_SCORE	3:1	14.50	2026-06-12 10:53:25.132
15592	135	CORRECT_SCORE	3:2	32.00	2026-06-12 10:53:25.132
15593	135	CORRECT_SCORE	4:0	35.00	2026-06-12 10:53:25.132
15594	135	CORRECT_SCORE	4:1	40.00	2026-06-12 10:53:25.132
15595	135	CORRECT_SCORE	4:2	90.00	2026-06-12 10:53:25.132
15596	135	CORRECT_SCORE	5:0	100.00	2026-06-12 10:53:25.132
15597	135	CORRECT_SCORE	5:1	100.00	2026-06-12 10:53:25.132
15598	135	CORRECT_SCORE	5:2	200.00	2026-06-12 10:53:25.132
15599	135	CORRECT_SCORE	胜其它	90.00	2026-06-12 10:53:25.132
15600	135	CORRECT_SCORE	0:0	8.00	2026-06-12 10:53:25.132
15601	135	CORRECT_SCORE	1:1	5.70	2026-06-12 10:53:25.132
15602	135	CORRECT_SCORE	2:2	16.00	2026-06-12 10:53:25.132
15603	135	CORRECT_SCORE	3:3	100.00	2026-06-12 10:53:25.132
15604	135	CORRECT_SCORE	平其它	600.00	2026-06-12 10:53:25.132
15605	135	CORRECT_SCORE	0:1	9.50	2026-06-12 10:53:25.132
15606	135	CORRECT_SCORE	0:2	21.00	2026-06-12 10:53:25.132
15607	135	CORRECT_SCORE	1:2	12.50	2026-06-12 10:53:25.132
15608	135	CORRECT_SCORE	0:3	70.00	2026-06-12 10:53:25.132
15609	135	CORRECT_SCORE	1:3	45.00	2026-06-12 10:53:25.132
15610	135	CORRECT_SCORE	2:3	55.00	2026-06-12 10:53:25.132
15611	135	CORRECT_SCORE	0:4	300.00	2026-06-12 10:53:25.132
15612	135	CORRECT_SCORE	1:4	200.00	2026-06-12 10:53:25.132
15613	135	CORRECT_SCORE	2:4	250.00	2026-06-12 10:53:25.132
15614	135	CORRECT_SCORE	0:5	800.00	2026-06-12 10:53:25.132
15615	135	CORRECT_SCORE	1:5	600.00	2026-06-12 10:53:25.132
15616	135	CORRECT_SCORE	2:5	700.00	2026-06-12 10:53:25.132
15617	135	CORRECT_SCORE	负其它	300.00	2026-06-12 10:53:25.132
15618	135	HALF_FULL	胜胜	2.80	2026-06-12 10:53:25.132
15619	135	HALF_FULL	胜平	16.00	2026-06-12 10:53:25.132
15620	135	HALF_FULL	胜负	40.00	2026-06-12 10:53:25.132
15621	135	HALF_FULL	平胜	4.15	2026-06-12 10:53:25.132
15622	135	HALF_FULL	平平	4.60	2026-06-12 10:53:25.132
15623	135	HALF_FULL	平负	8.75	2026-06-12 10:53:25.132
15624	135	HALF_FULL	负胜	28.00	2026-06-12 10:53:25.132
15625	135	HALF_FULL	负平	16.00	2026-06-12 10:53:25.132
15626	135	HALF_FULL	负负	7.20	2026-06-12 10:53:25.132
15627	146	HANDICAP_X1X	-2:home	1.80	2026-06-12 10:53:25.136
15628	146	HANDICAP_X1X	-2:draw	4.05	2026-06-12 10:53:25.136
15629	146	HANDICAP_X1X	-2:away	3.06	2026-06-12 10:53:25.136
15630	146	TOTAL_GOALS	0球	28.00	2026-06-12 10:53:25.136
15631	146	TOTAL_GOALS	1球	8.00	2026-06-12 10:53:25.136
15632	146	TOTAL_GOALS	2球	4.70	2026-06-12 10:53:25.136
15633	146	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.136
15634	146	TOTAL_GOALS	4球	4.30	2026-06-12 10:53:25.136
15635	146	TOTAL_GOALS	5球	6.10	2026-06-12 10:53:25.136
15636	146	TOTAL_GOALS	6球	9.00	2026-06-12 10:53:25.136
15637	146	TOTAL_GOALS	7+	10.50	2026-06-12 10:53:25.136
15638	146	CORRECT_SCORE	1:0	8.20	2026-06-12 10:53:25.136
15639	146	CORRECT_SCORE	2:0	5.60	2026-06-12 10:53:25.136
15640	146	CORRECT_SCORE	2:1	9.00	2026-06-12 10:53:25.136
15641	146	CORRECT_SCORE	3:0	5.70	2026-06-12 10:53:25.136
15642	146	CORRECT_SCORE	3:1	10.00	2026-06-12 10:53:25.136
15643	146	CORRECT_SCORE	3:2	40.00	2026-06-12 10:53:25.136
15644	146	CORRECT_SCORE	4:0	6.90	2026-06-12 10:53:25.136
15645	146	CORRECT_SCORE	4:1	14.00	2026-06-12 10:53:25.136
15646	146	CORRECT_SCORE	4:2	60.00	2026-06-12 10:53:25.136
15647	146	CORRECT_SCORE	5:0	10.50	2026-06-12 10:53:25.136
15648	146	CORRECT_SCORE	5:1	23.00	2026-06-12 10:53:25.136
15649	146	CORRECT_SCORE	5:2	90.00	2026-06-12 10:53:25.136
15650	146	CORRECT_SCORE	胜其它	7.80	2026-06-12 10:53:25.136
15651	146	CORRECT_SCORE	0:0	28.00	2026-06-12 10:53:25.136
15652	146	CORRECT_SCORE	1:1	16.00	2026-06-12 10:53:25.136
15653	146	CORRECT_SCORE	2:2	40.00	2026-06-12 10:53:25.136
15654	146	CORRECT_SCORE	3:3	200.00	2026-06-12 10:53:25.136
15655	146	CORRECT_SCORE	平其它	700.00	2026-06-12 10:53:25.136
15656	146	CORRECT_SCORE	0:1	60.00	2026-06-12 10:53:25.136
15657	146	CORRECT_SCORE	0:2	175.00	2026-06-12 10:53:25.136
15658	146	CORRECT_SCORE	1:2	60.00	2026-06-12 10:53:25.136
15659	146	CORRECT_SCORE	0:3	600.00	2026-06-12 10:53:25.136
15660	146	CORRECT_SCORE	1:3	350.00	2026-06-12 10:53:25.136
15661	146	CORRECT_SCORE	2:3	200.00	2026-06-12 10:53:25.136
15662	146	CORRECT_SCORE	0:4	1000.00	2026-06-12 10:53:25.136
15663	146	CORRECT_SCORE	1:4	800.00	2026-06-12 10:53:25.136
15664	146	CORRECT_SCORE	2:4	800.00	2026-06-12 10:53:25.136
15665	146	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.136
15666	146	CORRECT_SCORE	1:5	1000.00	2026-06-12 10:53:25.136
15667	146	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.136
15668	146	CORRECT_SCORE	负其它	800.00	2026-06-12 10:53:25.136
15669	146	HALF_FULL	胜胜	1.29	2026-06-12 10:53:25.136
15670	146	HALF_FULL	胜平	40.00	2026-06-12 10:53:25.136
15671	146	HALF_FULL	胜负	100.00	2026-06-12 10:53:25.136
15672	146	HALF_FULL	平胜	3.85	2026-06-12 10:53:25.136
15673	146	HALF_FULL	平平	13.50	2026-06-12 10:53:25.136
15674	146	HALF_FULL	平负	50.00	2026-06-12 10:53:25.136
15675	146	HALF_FULL	负胜	25.00	2026-06-12 10:53:25.136
15676	146	HALF_FULL	负平	40.00	2026-06-12 10:53:25.136
15677	146	HALF_FULL	负负	40.00	2026-06-12 10:53:25.136
15678	140	X1X	home	1.45	2026-06-12 10:53:25.14
15679	140	X1X	draw	3.72	2026-06-12 10:53:25.14
15680	140	X1X	away	5.85	2026-06-12 10:53:25.14
15681	140	HANDICAP_X1X	-1:home	2.62	2026-06-12 10:53:25.14
15682	140	HANDICAP_X1X	-1:draw	3.20	2026-06-12 10:53:25.14
15683	140	HANDICAP_X1X	-1:away	2.30	2026-06-12 10:53:25.14
15684	140	TOTAL_GOALS	0球	10.00	2026-06-12 10:53:25.14
15685	140	TOTAL_GOALS	1球	4.30	2026-06-12 10:53:25.14
15686	140	TOTAL_GOALS	2球	3.20	2026-06-12 10:53:25.14
15687	140	TOTAL_GOALS	3球	3.65	2026-06-12 10:53:25.14
15688	140	TOTAL_GOALS	4球	6.00	2026-06-12 10:53:25.14
15689	140	TOTAL_GOALS	5球	11.50	2026-06-12 10:53:25.14
15690	140	TOTAL_GOALS	6球	21.00	2026-06-12 10:53:25.14
15691	140	TOTAL_GOALS	7+	30.00	2026-06-12 10:53:25.14
15692	140	CORRECT_SCORE	1:0	5.65	2026-06-12 10:53:25.14
15693	140	CORRECT_SCORE	2:0	6.00	2026-06-12 10:53:25.14
15694	140	CORRECT_SCORE	2:1	6.75	2026-06-12 10:53:25.14
15695	140	CORRECT_SCORE	3:0	10.00	2026-06-12 10:53:25.14
15696	140	CORRECT_SCORE	3:1	11.50	2026-06-12 10:53:25.14
15697	140	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.14
15698	140	CORRECT_SCORE	4:0	21.00	2026-06-12 10:53:25.14
15699	140	CORRECT_SCORE	4:1	29.00	2026-06-12 10:53:25.14
15700	140	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.14
15701	140	CORRECT_SCORE	5:0	60.00	2026-06-12 10:53:25.14
15702	140	CORRECT_SCORE	5:1	75.00	2026-06-12 10:53:25.14
15703	140	CORRECT_SCORE	5:2	175.00	2026-06-12 10:53:25.14
15704	140	CORRECT_SCORE	胜其它	50.00	2026-06-12 10:53:25.14
15705	140	CORRECT_SCORE	0:0	10.00	2026-06-12 10:53:25.14
15706	140	CORRECT_SCORE	1:1	6.50	2026-06-12 10:53:25.14
15707	140	CORRECT_SCORE	2:2	18.00	2026-06-12 10:53:25.14
15708	140	CORRECT_SCORE	3:3	100.00	2026-06-12 10:53:25.14
15709	140	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:25.14
15710	140	CORRECT_SCORE	0:1	13.50	2026-06-12 10:53:25.14
15711	140	CORRECT_SCORE	0:2	30.00	2026-06-12 10:53:25.14
15712	140	CORRECT_SCORE	1:2	15.00	2026-06-12 10:53:25.14
15713	140	CORRECT_SCORE	0:3	100.00	2026-06-12 10:53:25.14
15714	140	CORRECT_SCORE	1:3	75.00	2026-06-12 10:53:25.14
15715	140	CORRECT_SCORE	2:3	75.00	2026-06-12 10:53:25.14
15716	140	CORRECT_SCORE	0:4	500.00	2026-06-12 10:53:25.14
15717	140	CORRECT_SCORE	1:4	350.00	2026-06-12 10:53:25.14
15718	140	CORRECT_SCORE	2:4	350.00	2026-06-12 10:53:25.14
15719	140	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.14
15720	140	CORRECT_SCORE	1:5	800.00	2026-06-12 10:53:25.14
15721	140	CORRECT_SCORE	2:5	900.00	2026-06-12 10:53:25.14
15722	140	CORRECT_SCORE	负其它	450.00	2026-06-12 10:53:25.14
15723	140	HALF_FULL	胜胜	2.12	2026-06-12 10:53:25.14
15724	140	HALF_FULL	胜平	19.00	2026-06-12 10:53:25.14
15725	140	HALF_FULL	胜负	45.00	2026-06-12 10:53:25.14
15726	140	HALF_FULL	平胜	3.90	2026-06-12 10:53:25.14
15727	140	HALF_FULL	平平	5.60	2026-06-12 10:53:25.14
15728	140	HALF_FULL	平负	12.00	2026-06-12 10:53:25.14
15729	140	HALF_FULL	负胜	24.00	2026-06-12 10:53:25.14
15730	140	HALF_FULL	负平	19.00	2026-06-12 10:53:25.14
15731	140	HALF_FULL	负负	10.50	2026-06-12 10:53:25.14
15732	147	X1X	home	7.65	2026-06-12 10:53:25.145
15733	147	X1X	draw	4.25	2026-06-12 10:53:25.145
15734	147	X1X	away	1.31	2026-06-12 10:53:25.145
15735	147	HANDICAP_X1X	1:home	2.84	2026-06-12 10:53:25.145
15736	147	HANDICAP_X1X	1:draw	3.30	2026-06-12 10:53:25.145
15737	147	HANDICAP_X1X	1:away	2.11	2026-06-12 10:53:25.145
15738	147	TOTAL_GOALS	0球	11.00	2026-06-12 10:53:25.145
15739	147	TOTAL_GOALS	1球	4.50	2026-06-12 10:53:25.145
15740	147	TOTAL_GOALS	2球	3.35	2026-06-12 10:53:25.145
15741	147	TOTAL_GOALS	3球	3.55	2026-06-12 10:53:25.145
15742	147	TOTAL_GOALS	4球	5.65	2026-06-12 10:53:25.145
15743	147	TOTAL_GOALS	5球	10.50	2026-06-12 10:53:25.145
15744	147	TOTAL_GOALS	6球	19.00	2026-06-12 10:53:25.145
15745	147	TOTAL_GOALS	7+	28.00	2026-06-12 10:53:25.145
15746	147	CORRECT_SCORE	1:0	16.00	2026-06-12 10:53:25.145
15747	147	CORRECT_SCORE	2:0	48.00	2026-06-12 10:53:25.145
15748	147	CORRECT_SCORE	2:1	21.00	2026-06-12 10:53:25.145
15749	147	CORRECT_SCORE	3:0	250.00	2026-06-12 10:53:25.145
15750	147	CORRECT_SCORE	3:1	100.00	2026-06-12 10:53:25.145
15751	147	CORRECT_SCORE	3:2	100.00	2026-06-12 10:53:25.145
15752	147	CORRECT_SCORE	4:0	600.00	2026-06-12 10:53:25.145
15753	147	CORRECT_SCORE	4:1	450.00	2026-06-12 10:53:25.145
15754	147	CORRECT_SCORE	4:2	450.00	2026-06-12 10:53:25.145
15755	147	CORRECT_SCORE	5:0	1000.00	2026-06-12 10:53:25.145
15756	147	CORRECT_SCORE	5:1	1000.00	2026-06-12 10:53:25.145
15757	147	CORRECT_SCORE	5:2	1000.00	2026-06-12 10:53:25.145
15758	147	CORRECT_SCORE	胜其它	600.00	2026-06-12 10:53:25.145
15759	147	CORRECT_SCORE	0:0	11.00	2026-06-12 10:53:25.145
15760	147	CORRECT_SCORE	1:1	7.75	2026-06-12 10:53:25.145
15761	147	CORRECT_SCORE	2:2	24.00	2026-06-12 10:53:25.145
15762	147	CORRECT_SCORE	3:3	150.00	2026-06-12 10:53:25.145
15763	147	CORRECT_SCORE	平其它	800.00	2026-06-12 10:53:25.145
15764	147	CORRECT_SCORE	0:1	5.50	2026-06-12 10:53:25.145
15765	147	CORRECT_SCORE	0:2	5.30	2026-06-12 10:53:25.145
15766	147	CORRECT_SCORE	1:2	7.00	2026-06-12 10:53:25.145
15767	147	CORRECT_SCORE	0:3	7.50	2026-06-12 10:53:25.145
15768	147	CORRECT_SCORE	1:3	11.00	2026-06-12 10:53:25.145
15769	147	CORRECT_SCORE	2:3	35.00	2026-06-12 10:53:25.145
15770	147	CORRECT_SCORE	0:4	15.00	2026-06-12 10:53:25.145
15771	147	CORRECT_SCORE	1:4	23.00	2026-06-12 10:53:25.145
15772	147	CORRECT_SCORE	2:4	75.00	2026-06-12 10:53:25.145
15773	147	CORRECT_SCORE	0:5	30.00	2026-06-12 10:53:25.145
15774	147	CORRECT_SCORE	1:5	60.00	2026-06-12 10:53:25.145
15775	147	CORRECT_SCORE	2:5	175.00	2026-06-12 10:53:25.145
15776	147	CORRECT_SCORE	负其它	35.00	2026-06-12 10:53:25.145
15777	147	HALF_FULL	胜胜	14.00	2026-06-12 10:53:25.145
15778	147	HALF_FULL	胜平	22.00	2026-06-12 10:53:25.145
15779	147	HALF_FULL	胜负	26.00	2026-06-12 10:53:25.145
15780	147	HALF_FULL	平胜	18.00	2026-06-12 10:53:25.145
15781	147	HALF_FULL	平平	6.00	2026-06-12 10:53:25.145
15782	147	HALF_FULL	平负	3.60	2026-06-12 10:53:25.145
15783	147	HALF_FULL	负胜	55.00	2026-06-12 10:53:25.145
15784	147	HALF_FULL	负平	22.00	2026-06-12 10:53:25.145
15785	147	HALF_FULL	负负	1.87	2026-06-12 10:53:25.145
15786	141	X1X	home	1.56	2026-06-12 10:53:25.149
15787	141	X1X	draw	3.30	2026-06-12 10:53:25.149
15788	141	X1X	away	5.40	2026-06-12 10:53:25.149
15789	141	HANDICAP_X1X	-1:home	3.10	2026-06-12 10:53:25.149
15790	141	HANDICAP_X1X	-1:draw	3.10	2026-06-12 10:53:25.149
15791	141	HANDICAP_X1X	-1:away	2.07	2026-06-12 10:53:25.149
15792	141	TOTAL_GOALS	0球	8.50	2026-06-12 10:53:25.149
15793	141	TOTAL_GOALS	1球	3.90	2026-06-12 10:53:25.149
15794	141	TOTAL_GOALS	2球	3.10	2026-06-12 10:53:25.149
15795	141	TOTAL_GOALS	3球	3.75	2026-06-12 10:53:25.149
15796	141	TOTAL_GOALS	4球	6.50	2026-06-12 10:53:25.149
15797	141	TOTAL_GOALS	5球	14.00	2026-06-12 10:53:25.149
15798	141	TOTAL_GOALS	6球	25.00	2026-06-12 10:53:25.149
15799	141	TOTAL_GOALS	7+	40.00	2026-06-12 10:53:25.149
15800	141	CORRECT_SCORE	1:0	5.25	2026-06-12 10:53:25.149
15801	141	CORRECT_SCORE	2:0	6.00	2026-06-12 10:53:25.149
15802	141	CORRECT_SCORE	2:1	6.70	2026-06-12 10:53:25.149
15803	141	CORRECT_SCORE	3:0	11.00	2026-06-12 10:53:25.149
15804	141	CORRECT_SCORE	3:1	12.00	2026-06-12 10:53:25.149
15805	141	CORRECT_SCORE	3:2	35.00	2026-06-12 10:53:25.149
15806	141	CORRECT_SCORE	4:0	26.00	2026-06-12 10:53:25.149
15807	141	CORRECT_SCORE	4:1	35.00	2026-06-12 10:53:25.149
15808	141	CORRECT_SCORE	4:2	90.00	2026-06-12 10:53:25.149
15809	141	CORRECT_SCORE	5:0	75.00	2026-06-12 10:53:25.149
15810	141	CORRECT_SCORE	5:1	100.00	2026-06-12 10:53:25.149
15811	141	CORRECT_SCORE	5:2	250.00	2026-06-12 10:53:25.149
15812	141	CORRECT_SCORE	胜其它	75.00	2026-06-12 10:53:25.149
15813	141	CORRECT_SCORE	0:0	8.50	2026-06-12 10:53:25.149
15814	141	CORRECT_SCORE	1:1	6.00	2026-06-12 10:53:25.149
15815	141	CORRECT_SCORE	2:2	19.00	2026-06-12 10:53:25.149
15816	141	CORRECT_SCORE	3:3	125.00	2026-06-12 10:53:25.149
15817	141	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:25.149
15818	141	CORRECT_SCORE	0:1	12.00	2026-06-12 10:53:25.149
15819	141	CORRECT_SCORE	0:2	30.00	2026-06-12 10:53:25.149
15820	141	CORRECT_SCORE	1:2	15.00	2026-06-12 10:53:25.149
15821	141	CORRECT_SCORE	0:3	100.00	2026-06-12 10:53:25.149
15822	141	CORRECT_SCORE	1:3	70.00	2026-06-12 10:53:25.149
15823	141	CORRECT_SCORE	2:3	75.00	2026-06-12 10:53:25.149
15824	141	CORRECT_SCORE	0:4	400.00	2026-06-12 10:53:25.149
15825	141	CORRECT_SCORE	1:4	300.00	2026-06-12 10:53:25.149
15826	141	CORRECT_SCORE	2:4	350.00	2026-06-12 10:53:25.149
15827	141	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.149
15828	141	CORRECT_SCORE	1:5	900.00	2026-06-12 10:53:25.149
15829	141	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.149
15830	141	CORRECT_SCORE	负其它	450.00	2026-06-12 10:53:25.149
15831	141	HALF_FULL	胜胜	2.46	2026-06-12 10:53:25.149
15832	141	HALF_FULL	胜平	17.00	2026-06-12 10:53:25.149
15833	141	HALF_FULL	胜负	35.00	2026-06-12 10:53:25.149
15834	141	HALF_FULL	平胜	4.00	2026-06-12 10:53:25.149
15835	141	HALF_FULL	平平	5.00	2026-06-12 10:53:25.149
15836	141	HALF_FULL	平负	10.50	2026-06-12 10:53:25.149
15837	141	HALF_FULL	负胜	22.00	2026-06-12 10:53:25.149
15838	141	HALF_FULL	负平	17.00	2026-06-12 10:53:25.149
15839	141	HALF_FULL	负负	9.00	2026-06-12 10:53:25.149
15840	152	X1X	home	1.37	2026-06-12 10:53:25.154
15841	152	X1X	draw	3.95	2026-06-12 10:53:25.154
15842	152	X1X	away	6.85	2026-06-12 10:53:25.154
15843	152	HANDICAP_X1X	-1:home	2.29	2026-06-12 10:53:25.154
15844	152	HANDICAP_X1X	-1:draw	3.20	2026-06-12 10:53:25.154
15845	152	HANDICAP_X1X	-1:away	2.63	2026-06-12 10:53:25.154
15846	152	TOTAL_GOALS	0球	10.50	2026-06-12 10:53:25.154
15847	152	TOTAL_GOALS	1球	4.40	2026-06-12 10:53:25.154
15848	152	TOTAL_GOALS	2球	3.25	2026-06-12 10:53:25.154
15849	152	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.154
15850	152	TOTAL_GOALS	4球	5.80	2026-06-12 10:53:25.154
15851	152	TOTAL_GOALS	5球	11.00	2026-06-12 10:53:25.154
15852	152	TOTAL_GOALS	6球	20.00	2026-06-12 10:53:25.154
15853	152	TOTAL_GOALS	7+	30.00	2026-06-12 10:53:25.154
15854	152	CORRECT_SCORE	1:0	5.50	2026-06-12 10:53:25.154
15855	152	CORRECT_SCORE	2:0	5.90	2026-06-12 10:53:25.154
15856	152	CORRECT_SCORE	2:1	6.80	2026-06-12 10:53:25.154
15857	152	CORRECT_SCORE	3:0	8.50	2026-06-12 10:53:25.154
15858	152	CORRECT_SCORE	3:1	11.00	2026-06-12 10:53:25.154
15859	152	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.154
15860	152	CORRECT_SCORE	4:0	17.00	2026-06-12 10:53:25.154
15861	152	CORRECT_SCORE	4:1	26.00	2026-06-12 10:53:25.154
15862	152	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.154
15863	152	CORRECT_SCORE	5:0	50.00	2026-06-12 10:53:25.154
15864	152	CORRECT_SCORE	5:1	75.00	2026-06-12 10:53:25.154
15865	152	CORRECT_SCORE	5:2	175.00	2026-06-12 10:53:25.154
15866	152	CORRECT_SCORE	胜其它	45.00	2026-06-12 10:53:25.154
15867	152	CORRECT_SCORE	0:0	10.50	2026-06-12 10:53:25.154
15868	152	CORRECT_SCORE	1:1	6.80	2026-06-12 10:53:25.154
15869	152	CORRECT_SCORE	2:2	20.00	2026-06-12 10:53:25.154
15870	152	CORRECT_SCORE	3:3	125.00	2026-06-12 10:53:25.154
15871	152	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:25.154
15872	152	CORRECT_SCORE	0:1	15.00	2026-06-12 10:53:25.154
15873	152	CORRECT_SCORE	0:2	40.00	2026-06-12 10:53:25.154
15874	152	CORRECT_SCORE	1:2	17.00	2026-06-12 10:53:25.154
15875	152	CORRECT_SCORE	0:3	150.00	2026-06-12 10:53:25.154
15876	152	CORRECT_SCORE	1:3	80.00	2026-06-12 10:53:25.154
15877	152	CORRECT_SCORE	2:3	90.00	2026-06-12 10:53:25.154
15878	152	CORRECT_SCORE	0:4	500.00	2026-06-12 10:53:25.154
15879	152	CORRECT_SCORE	1:4	400.00	2026-06-12 10:53:25.154
15880	152	CORRECT_SCORE	2:4	400.00	2026-06-12 10:53:25.154
15881	152	CORRECT_SCORE	0:5	900.00	2026-06-12 10:53:25.154
15882	152	CORRECT_SCORE	1:5	800.00	2026-06-12 10:53:25.154
15883	152	CORRECT_SCORE	2:5	800.00	2026-06-12 10:53:25.154
15884	152	CORRECT_SCORE	负其它	400.00	2026-06-12 10:53:25.154
15885	152	HALF_FULL	胜胜	1.93	2026-06-12 10:53:25.154
15886	152	HALF_FULL	胜平	21.00	2026-06-12 10:53:25.154
15887	152	HALF_FULL	胜负	50.00	2026-06-12 10:53:25.154
15888	152	HALF_FULL	平胜	3.80	2026-06-12 10:53:25.154
15889	152	HALF_FULL	平平	5.90	2026-06-12 10:53:25.154
15890	152	HALF_FULL	平负	14.00	2026-06-12 10:53:25.154
15891	152	HALF_FULL	负胜	25.00	2026-06-12 10:53:25.154
15892	152	HALF_FULL	负平	21.00	2026-06-12 10:53:25.154
15893	152	HALF_FULL	负负	13.00	2026-06-12 10:53:25.154
15894	153	HANDICAP_X1X	2:home	2.09	2026-06-12 10:53:25.158
15895	153	HANDICAP_X1X	2:draw	3.89	2026-06-12 10:53:25.158
15896	153	HANDICAP_X1X	2:away	2.54	2026-06-12 10:53:25.158
15897	153	TOTAL_GOALS	0球	18.00	2026-06-12 10:53:25.158
15898	153	TOTAL_GOALS	1球	6.00	2026-06-12 10:53:25.158
15899	153	TOTAL_GOALS	2球	3.95	2026-06-12 10:53:25.158
15900	153	TOTAL_GOALS	3球	3.45	2026-06-12 10:53:25.158
15901	153	TOTAL_GOALS	4球	4.70	2026-06-12 10:53:25.158
15902	153	TOTAL_GOALS	5球	7.20	2026-06-12 10:53:25.158
15903	153	TOTAL_GOALS	6球	13.00	2026-06-12 10:53:25.158
15904	153	TOTAL_GOALS	7+	17.00	2026-06-12 10:53:25.158
15905	153	CORRECT_SCORE	1:0	30.00	2026-06-12 10:53:25.158
15906	153	CORRECT_SCORE	2:0	100.00	2026-06-12 10:53:25.158
15907	153	CORRECT_SCORE	2:1	29.00	2026-06-12 10:53:25.158
15908	153	CORRECT_SCORE	3:0	350.00	2026-06-12 10:53:25.158
15909	153	CORRECT_SCORE	3:1	175.00	2026-06-12 10:53:25.158
15910	153	CORRECT_SCORE	3:2	100.00	2026-06-12 10:53:25.158
15911	153	CORRECT_SCORE	4:0	900.00	2026-06-12 10:53:25.158
15912	153	CORRECT_SCORE	4:1	600.00	2026-06-12 10:53:25.158
15913	153	CORRECT_SCORE	4:2	500.00	2026-06-12 10:53:25.158
15914	153	CORRECT_SCORE	5:0	1000.00	2026-06-12 10:53:25.158
15915	153	CORRECT_SCORE	5:1	1000.00	2026-06-12 10:53:25.158
15916	153	CORRECT_SCORE	5:2	1000.00	2026-06-12 10:53:25.158
15917	153	CORRECT_SCORE	胜其它	500.00	2026-06-12 10:53:25.158
15918	153	CORRECT_SCORE	0:0	18.00	2026-06-12 10:53:25.158
15919	153	CORRECT_SCORE	1:1	10.00	2026-06-12 10:53:25.158
15920	153	CORRECT_SCORE	2:2	26.00	2026-06-12 10:53:25.158
15921	153	CORRECT_SCORE	3:3	125.00	2026-06-12 10:53:25.158
15922	153	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:25.158
15923	153	CORRECT_SCORE	0:1	6.60	2026-06-12 10:53:25.158
15924	153	CORRECT_SCORE	0:2	5.60	2026-06-12 10:53:25.158
15925	153	CORRECT_SCORE	1:2	7.75	2026-06-12 10:53:25.158
15926	153	CORRECT_SCORE	0:3	6.50	2026-06-12 10:53:25.158
15927	153	CORRECT_SCORE	1:3	9.00	2026-06-12 10:53:25.158
15928	153	CORRECT_SCORE	2:3	35.00	2026-06-12 10:53:25.158
15929	153	CORRECT_SCORE	0:4	10.00	2026-06-12 10:53:25.158
15930	153	CORRECT_SCORE	1:4	16.00	2026-06-12 10:53:25.158
15931	153	CORRECT_SCORE	2:4	50.00	2026-06-12 10:53:25.158
15932	153	CORRECT_SCORE	0:5	19.00	2026-06-12 10:53:25.158
15933	153	CORRECT_SCORE	1:5	30.00	2026-06-12 10:53:25.158
15934	153	CORRECT_SCORE	2:5	100.00	2026-06-12 10:53:25.158
15935	153	CORRECT_SCORE	负其它	15.00	2026-06-12 10:53:25.158
15936	153	HALF_FULL	胜胜	24.00	2026-06-12 10:53:25.158
15937	153	HALF_FULL	胜平	26.00	2026-06-12 10:53:25.158
15938	153	HALF_FULL	胜负	25.00	2026-06-12 10:53:25.158
15939	153	HALF_FULL	平胜	27.00	2026-06-12 10:53:25.158
15940	153	HALF_FULL	平平	8.75	2026-06-12 10:53:25.158
15941	153	HALF_FULL	平负	3.70	2026-06-12 10:53:25.158
15942	153	HALF_FULL	负胜	80.00	2026-06-12 10:53:25.158
15943	153	HALF_FULL	负平	26.00	2026-06-12 10:53:25.158
15944	153	HALF_FULL	负负	1.51	2026-06-12 10:53:25.158
15945	158	X1X	home	1.27	2026-06-12 10:53:25.161
15946	158	X1X	draw	4.35	2026-06-12 10:53:25.161
15947	158	X1X	away	8.90	2026-06-12 10:53:25.161
15948	158	HANDICAP_X1X	-1:home	2.00	2026-06-12 10:53:25.161
15949	158	HANDICAP_X1X	-1:draw	3.32	2026-06-12 10:53:25.161
15950	158	HANDICAP_X1X	-1:away	3.05	2026-06-12 10:53:25.161
15951	158	TOTAL_GOALS	0球	11.00	2026-06-12 10:53:25.161
15952	158	TOTAL_GOALS	1球	4.50	2026-06-12 10:53:25.161
15953	158	TOTAL_GOALS	2球	3.40	2026-06-12 10:53:25.161
15954	158	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.161
15955	158	TOTAL_GOALS	4球	5.50	2026-06-12 10:53:25.161
15956	158	TOTAL_GOALS	5球	10.00	2026-06-12 10:53:25.161
15957	158	TOTAL_GOALS	6球	19.00	2026-06-12 10:53:25.161
15958	158	TOTAL_GOALS	7+	29.00	2026-06-12 10:53:25.161
15959	158	CORRECT_SCORE	1:0	5.20	2026-06-12 10:53:25.161
15960	158	CORRECT_SCORE	2:0	5.20	2026-06-12 10:53:25.161
15961	158	CORRECT_SCORE	2:1	7.00	2026-06-12 10:53:25.161
15962	158	CORRECT_SCORE	3:0	8.00	2026-06-12 10:53:25.161
15963	158	CORRECT_SCORE	3:1	11.00	2026-06-12 10:53:25.161
15964	158	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.161
15965	158	CORRECT_SCORE	4:0	15.00	2026-06-12 10:53:25.161
15966	158	CORRECT_SCORE	4:1	22.00	2026-06-12 10:53:25.161
15967	158	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.161
15968	158	CORRECT_SCORE	5:0	35.00	2026-06-12 10:53:25.161
15969	158	CORRECT_SCORE	5:1	60.00	2026-06-12 10:53:25.161
15970	158	CORRECT_SCORE	5:2	175.00	2026-06-12 10:53:25.161
15971	158	CORRECT_SCORE	胜其它	40.00	2026-06-12 10:53:25.161
15972	158	CORRECT_SCORE	0:0	11.00	2026-06-12 10:53:25.161
15973	158	CORRECT_SCORE	1:1	7.50	2026-06-12 10:53:25.161
15974	158	CORRECT_SCORE	2:2	24.00	2026-06-12 10:53:25.161
15975	158	CORRECT_SCORE	3:3	150.00	2026-06-12 10:53:25.161
15976	158	CORRECT_SCORE	平其它	800.00	2026-06-12 10:53:25.161
15977	158	CORRECT_SCORE	0:1	16.00	2026-06-12 10:53:25.161
15978	158	CORRECT_SCORE	0:2	50.00	2026-06-12 10:53:25.161
15979	158	CORRECT_SCORE	1:2	25.00	2026-06-12 10:53:25.161
15980	158	CORRECT_SCORE	0:3	200.00	2026-06-12 10:53:25.161
15981	158	CORRECT_SCORE	1:3	100.00	2026-06-12 10:53:25.161
15982	158	CORRECT_SCORE	2:3	100.00	2026-06-12 10:53:25.161
15983	158	CORRECT_SCORE	0:4	700.00	2026-06-12 10:53:25.161
15984	158	CORRECT_SCORE	1:4	500.00	2026-06-12 10:53:25.161
15985	158	CORRECT_SCORE	2:4	500.00	2026-06-12 10:53:25.161
15986	158	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.161
15987	158	CORRECT_SCORE	1:5	1000.00	2026-06-12 10:53:25.161
15988	158	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.161
15989	158	CORRECT_SCORE	负其它	600.00	2026-06-12 10:53:25.161
15990	158	HALF_FULL	胜胜	1.90	2026-06-12 10:53:25.161
15991	158	HALF_FULL	胜平	21.00	2026-06-12 10:53:25.161
15992	158	HALF_FULL	胜负	60.00	2026-06-12 10:53:25.161
15993	158	HALF_FULL	平胜	3.45	2026-06-12 10:53:25.161
15994	158	HALF_FULL	平平	6.00	2026-06-12 10:53:25.161
15995	158	HALF_FULL	平负	17.00	2026-06-12 10:53:25.161
15996	158	HALF_FULL	负胜	30.00	2026-06-12 10:53:25.161
15997	158	HALF_FULL	负平	21.00	2026-06-12 10:53:25.161
4839	113	X1X	home	2.78	2026-06-11 12:34:44.174
4840	113	X1X	draw	3.62	2026-06-11 12:34:44.174
4841	113	X1X	away	2.23	2026-06-11 12:34:44.174
4842	113	TOTAL_GOALS	0球	8.34	2026-06-11 12:34:44.174
4843	113	TOTAL_GOALS	1球	4.81	2026-06-11 12:34:44.174
4844	113	TOTAL_GOALS	2球	3.43	2026-06-11 12:34:44.174
4845	113	TOTAL_GOALS	3球+	2.32	2026-06-11 12:34:44.174
4846	113	CORRECT_SCORE	1:0	6.08	2026-06-11 12:34:44.174
4847	113	CORRECT_SCORE	1:1	6.20	2026-06-11 12:34:44.174
4848	113	CORRECT_SCORE	2:0	8.86	2026-06-11 12:34:44.174
4849	113	CORRECT_SCORE	2:1	8.86	2026-06-11 12:34:44.174
4850	113	CORRECT_SCORE	0:1	7.91	2026-06-11 12:34:44.174
4851	113	CORRECT_SCORE	0:0	8.69	2026-06-11 12:34:44.174
4852	114	X1X	home	3.05	2026-06-11 12:34:44.178
4853	114	X1X	draw	3.63	2026-06-11 12:34:44.178
4854	114	X1X	away	3.49	2026-06-11 12:34:44.178
4855	114	TOTAL_GOALS	0球	9.96	2026-06-11 12:34:44.178
4856	114	TOTAL_GOALS	1球	4.79	2026-06-11 12:34:44.178
4857	114	TOTAL_GOALS	2球	3.72	2026-06-11 12:34:44.178
4858	114	TOTAL_GOALS	3球+	2.60	2026-06-11 12:34:44.178
4859	114	CORRECT_SCORE	1:0	6.26	2026-06-11 12:34:44.178
4860	114	CORRECT_SCORE	1:1	5.36	2026-06-11 12:34:44.178
4861	114	CORRECT_SCORE	2:0	10.47	2026-06-11 12:34:44.178
4862	114	CORRECT_SCORE	2:1	7.32	2026-06-11 12:34:44.178
4863	114	CORRECT_SCORE	0:1	7.80	2026-06-11 12:34:44.178
4864	114	CORRECT_SCORE	0:0	8.08	2026-06-11 12:34:44.178
4865	115	X1X	home	3.03	2026-06-11 12:34:44.181
4866	115	X1X	draw	3.48	2026-06-11 12:34:44.181
4867	115	X1X	away	3.46	2026-06-11 12:34:44.181
4868	115	TOTAL_GOALS	0球	8.76	2026-06-11 12:34:44.181
4869	115	TOTAL_GOALS	1球	4.45	2026-06-11 12:34:44.181
4870	115	TOTAL_GOALS	2球	3.06	2026-06-11 12:34:44.181
4871	115	TOTAL_GOALS	3球+	1.88	2026-06-11 12:34:44.181
4872	115	CORRECT_SCORE	1:0	6.45	2026-06-11 12:34:44.181
4873	115	CORRECT_SCORE	1:1	5.73	2026-06-11 12:34:44.181
4874	115	CORRECT_SCORE	2:0	9.83	2026-06-11 12:34:44.181
4875	115	CORRECT_SCORE	2:1	8.68	2026-06-11 12:34:44.181
4876	115	CORRECT_SCORE	0:1	7.77	2026-06-11 12:34:44.181
4877	115	CORRECT_SCORE	0:0	8.26	2026-06-11 12:34:44.181
4904	118	X1X	home	2.86	2026-06-11 12:34:44.19
4905	118	X1X	draw	3.01	2026-06-11 12:34:44.19
4906	118	X1X	away	2.08	2026-06-11 12:34:44.19
4907	118	TOTAL_GOALS	0球	8.29	2026-06-11 12:34:44.19
4908	118	TOTAL_GOALS	1球	4.95	2026-06-11 12:34:44.19
4909	118	TOTAL_GOALS	2球	3.24	2026-06-11 12:34:44.19
4910	118	TOTAL_GOALS	3球+	2.42	2026-06-11 12:34:44.19
4911	118	CORRECT_SCORE	1:0	6.91	2026-06-11 12:34:44.19
4912	118	CORRECT_SCORE	1:1	5.16	2026-06-11 12:34:44.19
4913	118	CORRECT_SCORE	2:0	10.89	2026-06-11 12:34:44.19
4914	118	CORRECT_SCORE	2:1	8.21	2026-06-11 12:34:44.19
4915	118	CORRECT_SCORE	0:1	7.58	2026-06-11 12:34:44.19
4916	118	CORRECT_SCORE	0:0	8.18	2026-06-11 12:34:44.19
4917	119	X1X	home	2.07	2026-06-11 12:34:44.192
4918	119	X1X	draw	3.07	2026-06-11 12:34:44.192
4919	119	X1X	away	2.75	2026-06-11 12:34:44.192
4920	119	TOTAL_GOALS	0球	9.82	2026-06-11 12:34:44.192
4921	119	TOTAL_GOALS	1球	4.49	2026-06-11 12:34:44.192
4922	119	TOTAL_GOALS	2球	3.68	2026-06-11 12:34:44.192
4923	119	TOTAL_GOALS	3球+	2.28	2026-06-11 12:34:44.192
4924	119	CORRECT_SCORE	1:0	7.25	2026-06-11 12:34:44.192
4925	119	CORRECT_SCORE	1:1	6.34	2026-06-11 12:34:44.192
4926	119	CORRECT_SCORE	2:0	10.51	2026-06-11 12:34:44.192
4927	119	CORRECT_SCORE	2:1	7.29	2026-06-11 12:34:44.192
4928	119	CORRECT_SCORE	0:1	7.90	2026-06-11 12:34:44.192
4929	119	CORRECT_SCORE	0:0	8.72	2026-06-11 12:34:44.192
4930	120	X1X	home	2.26	2026-06-11 12:34:44.195
4931	120	X1X	draw	3.27	2026-06-11 12:34:44.195
4932	120	X1X	away	2.86	2026-06-11 12:34:44.195
4933	120	TOTAL_GOALS	0球	9.74	2026-06-11 12:34:44.195
4934	120	TOTAL_GOALS	1球	4.93	2026-06-11 12:34:44.195
4935	120	TOTAL_GOALS	2球	3.23	2026-06-11 12:34:44.195
4936	120	TOTAL_GOALS	3球+	2.43	2026-06-11 12:34:44.195
4937	120	CORRECT_SCORE	1:0	6.34	2026-06-11 12:34:44.195
4938	120	CORRECT_SCORE	1:1	6.43	2026-06-11 12:34:44.195
4939	120	CORRECT_SCORE	2:0	10.77	2026-06-11 12:34:44.195
4940	120	CORRECT_SCORE	2:1	7.92	2026-06-11 12:34:44.195
4941	120	CORRECT_SCORE	0:1	8.50	2026-06-11 12:34:44.195
4942	120	CORRECT_SCORE	0:0	7.10	2026-06-11 12:34:44.195
4943	121	X1X	home	2.27	2026-06-11 12:34:44.198
4944	121	X1X	draw	3.35	2026-06-11 12:34:44.198
4945	121	X1X	away	2.61	2026-06-11 12:34:44.198
4946	121	TOTAL_GOALS	0球	8.47	2026-06-11 12:34:44.198
4947	121	TOTAL_GOALS	1球	4.18	2026-06-11 12:34:44.198
4948	121	TOTAL_GOALS	2球	3.09	2026-06-11 12:34:44.198
4949	121	TOTAL_GOALS	3球+	1.85	2026-06-11 12:34:44.198
4950	121	CORRECT_SCORE	1:0	7.20	2026-06-11 12:34:44.198
4951	121	CORRECT_SCORE	1:1	5.17	2026-06-11 12:34:44.198
4952	121	CORRECT_SCORE	2:0	8.64	2026-06-11 12:34:44.198
4953	121	CORRECT_SCORE	2:1	7.44	2026-06-11 12:34:44.198
4954	121	CORRECT_SCORE	0:1	7.45	2026-06-11 12:34:44.198
4955	121	CORRECT_SCORE	0:0	7.95	2026-06-11 12:34:44.198
15998	158	HALF_FULL	负负	15.00	2026-06-12 10:53:25.161
15999	159	X1X	home	1.22	2026-06-12 10:53:25.164
16000	159	X1X	draw	5.00	2026-06-12 10:53:25.164
16001	159	X1X	away	9.10	2026-06-12 10:53:25.164
16002	159	HANDICAP_X1X	-1:home	1.82	2026-06-12 10:53:25.164
16003	159	HANDICAP_X1X	-1:draw	3.47	2026-06-12 10:53:25.164
16004	159	HANDICAP_X1X	-1:away	3.43	2026-06-12 10:53:25.164
16005	159	TOTAL_GOALS	0球	14.00	2026-06-12 10:53:25.164
16006	159	TOTAL_GOALS	1球	5.50	2026-06-12 10:53:25.164
16007	159	TOTAL_GOALS	2球	3.70	2026-06-12 10:53:25.164
16008	159	TOTAL_GOALS	3球	3.50	2026-06-12 10:53:25.164
16009	159	TOTAL_GOALS	4球	4.85	2026-06-12 10:53:25.164
16010	159	TOTAL_GOALS	5球	8.00	2026-06-12 10:53:25.164
16011	159	TOTAL_GOALS	6球	15.00	2026-06-12 10:53:25.164
16012	159	TOTAL_GOALS	7+	21.00	2026-06-12 10:53:25.164
16013	159	CORRECT_SCORE	1:0	6.00	2026-06-12 10:53:25.164
16014	159	CORRECT_SCORE	2:0	5.70	2026-06-12 10:53:25.164
16015	159	CORRECT_SCORE	2:1	7.00	2026-06-12 10:53:25.164
16016	159	CORRECT_SCORE	3:0	7.50	2026-06-12 10:53:25.164
16017	159	CORRECT_SCORE	3:1	10.00	2026-06-12 10:53:25.164
16018	159	CORRECT_SCORE	3:2	26.00	2026-06-12 10:53:25.164
16019	159	CORRECT_SCORE	4:0	13.00	2026-06-12 10:53:25.164
16020	159	CORRECT_SCORE	4:1	18.00	2026-06-12 10:53:25.164
16021	159	CORRECT_SCORE	4:2	50.00	2026-06-12 10:53:25.164
16022	159	CORRECT_SCORE	5:0	28.00	2026-06-12 10:53:25.164
4982	124	X1X	home	3.53	2026-06-11 12:34:44.206
4983	124	X1X	draw	3.20	2026-06-11 12:34:44.206
4984	124	X1X	away	2.95	2026-06-11 12:34:44.206
4985	124	TOTAL_GOALS	0球	9.56	2026-06-11 12:34:44.206
4986	124	TOTAL_GOALS	1球	4.55	2026-06-11 12:34:44.206
4987	124	TOTAL_GOALS	2球	3.65	2026-06-11 12:34:44.206
4988	124	TOTAL_GOALS	3球+	2.09	2026-06-11 12:34:44.206
4989	124	CORRECT_SCORE	1:0	6.88	2026-06-11 12:34:44.206
4990	124	CORRECT_SCORE	1:1	5.59	2026-06-11 12:34:44.206
4991	124	CORRECT_SCORE	2:0	8.29	2026-06-11 12:34:44.206
4992	124	CORRECT_SCORE	2:1	8.24	2026-06-11 12:34:44.206
4993	124	CORRECT_SCORE	0:1	9.52	2026-06-11 12:34:44.206
4994	124	CORRECT_SCORE	0:0	7.20	2026-06-11 12:34:44.206
4995	125	X1X	home	1.97	2026-06-11 12:34:44.209
4996	125	X1X	draw	3.53	2026-06-11 12:34:44.209
4997	125	X1X	away	2.48	2026-06-11 12:34:44.209
4998	125	TOTAL_GOALS	0球	8.28	2026-06-11 12:34:44.209
4999	125	TOTAL_GOALS	1球	4.40	2026-06-11 12:34:44.209
5000	125	TOTAL_GOALS	2球	3.61	2026-06-11 12:34:44.209
5001	125	TOTAL_GOALS	3球+	1.95	2026-06-11 12:34:44.209
5002	125	CORRECT_SCORE	1:0	6.41	2026-06-11 12:34:44.209
5003	125	CORRECT_SCORE	1:1	6.00	2026-06-11 12:34:44.209
5004	125	CORRECT_SCORE	2:0	8.06	2026-06-11 12:34:44.209
5005	125	CORRECT_SCORE	2:1	8.40	2026-06-11 12:34:44.209
5006	125	CORRECT_SCORE	0:1	8.91	2026-06-11 12:34:44.209
5007	125	CORRECT_SCORE	0:0	8.42	2026-06-11 12:34:44.209
5008	126	X1X	home	2.27	2026-06-11 12:34:44.211
5009	126	X1X	draw	3.25	2026-06-11 12:34:44.211
5010	126	X1X	away	3.52	2026-06-11 12:34:44.211
5011	126	TOTAL_GOALS	0球	8.23	2026-06-11 12:34:44.211
5012	126	TOTAL_GOALS	1球	4.24	2026-06-11 12:34:44.211
5013	126	TOTAL_GOALS	2球	3.60	2026-06-11 12:34:44.211
5014	126	TOTAL_GOALS	3球+	2.24	2026-06-11 12:34:44.211
5015	126	CORRECT_SCORE	1:0	6.25	2026-06-11 12:34:44.211
5016	126	CORRECT_SCORE	1:1	5.71	2026-06-11 12:34:44.211
5017	126	CORRECT_SCORE	2:0	9.39	2026-06-11 12:34:44.211
5018	126	CORRECT_SCORE	2:1	8.94	2026-06-11 12:34:44.211
5019	126	CORRECT_SCORE	0:1	7.74	2026-06-11 12:34:44.211
5020	126	CORRECT_SCORE	0:0	8.31	2026-06-11 12:34:44.211
5021	127	X1X	home	1.84	2026-06-11 12:34:44.214
5022	127	X1X	draw	3.52	2026-06-11 12:34:44.214
5023	127	X1X	away	3.33	2026-06-11 12:34:44.214
5024	127	TOTAL_GOALS	0球	8.68	2026-06-11 12:34:44.214
5025	127	TOTAL_GOALS	1球	4.30	2026-06-11 12:34:44.214
5026	127	TOTAL_GOALS	2球	3.61	2026-06-11 12:34:44.214
5027	127	TOTAL_GOALS	3球+	2.14	2026-06-11 12:34:44.214
5028	127	CORRECT_SCORE	1:0	7.50	2026-06-11 12:34:44.214
5029	127	CORRECT_SCORE	1:1	6.44	2026-06-11 12:34:44.214
5030	127	CORRECT_SCORE	2:0	9.11	2026-06-11 12:34:44.214
5031	127	CORRECT_SCORE	2:1	7.41	2026-06-11 12:34:44.214
5032	127	CORRECT_SCORE	0:1	8.10	2026-06-11 12:34:44.214
5033	127	CORRECT_SCORE	0:0	8.06	2026-06-11 12:34:44.214
16023	159	CORRECT_SCORE	5:1	45.00	2026-06-12 10:53:25.164
16024	159	CORRECT_SCORE	5:2	100.00	2026-06-12 10:53:25.164
16025	159	CORRECT_SCORE	胜其它	23.00	2026-06-12 10:53:25.164
16026	159	CORRECT_SCORE	0:0	14.00	2026-06-12 10:53:25.164
16027	159	CORRECT_SCORE	1:1	8.50	2026-06-12 10:53:25.164
16028	159	CORRECT_SCORE	2:2	22.00	2026-06-12 10:53:25.164
16029	159	CORRECT_SCORE	3:3	120.00	2026-06-12 10:53:25.164
16030	159	CORRECT_SCORE	平其它	700.00	2026-06-12 10:53:25.164
16031	159	CORRECT_SCORE	0:1	19.00	2026-06-12 10:53:25.164
16032	159	CORRECT_SCORE	0:2	60.00	2026-06-12 10:53:25.164
16033	159	CORRECT_SCORE	1:2	25.00	2026-06-12 10:53:25.164
16034	159	CORRECT_SCORE	0:3	250.00	2026-06-12 10:53:25.164
16035	159	CORRECT_SCORE	1:3	100.00	2026-06-12 10:53:25.164
16036	159	CORRECT_SCORE	2:3	90.00	2026-06-12 10:53:25.164
16037	159	CORRECT_SCORE	0:4	700.00	2026-06-12 10:53:25.164
16038	159	CORRECT_SCORE	1:4	500.00	2026-06-12 10:53:25.164
16039	159	CORRECT_SCORE	2:4	500.00	2026-06-12 10:53:25.164
16040	159	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.164
16041	159	CORRECT_SCORE	1:5	1000.00	2026-06-12 10:53:25.164
16042	159	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.164
16043	159	CORRECT_SCORE	负其它	500.00	2026-06-12 10:53:25.164
16044	159	HALF_FULL	胜胜	1.80	2026-06-12 10:53:25.164
16045	159	HALF_FULL	胜平	21.00	2026-06-12 10:53:25.164
16046	159	HALF_FULL	胜负	80.00	2026-06-12 10:53:25.164
16047	159	HALF_FULL	平胜	3.60	2026-06-12 10:53:25.164
16048	159	HALF_FULL	平平	7.00	2026-06-12 10:53:25.164
5060	130	X1X	home	1.89	2026-06-11 12:34:44.224
5061	130	X1X	draw	3.64	2026-06-11 12:34:44.224
5062	130	X1X	away	2.98	2026-06-11 12:34:44.224
5063	130	TOTAL_GOALS	0球	9.03	2026-06-11 12:34:44.224
5064	130	TOTAL_GOALS	1球	4.57	2026-06-11 12:34:44.224
5065	130	TOTAL_GOALS	2球	3.39	2026-06-11 12:34:44.224
5066	130	TOTAL_GOALS	3球+	2.51	2026-06-11 12:34:44.224
5067	130	CORRECT_SCORE	1:0	7.83	2026-06-11 12:34:44.224
5068	130	CORRECT_SCORE	1:1	5.49	2026-06-11 12:34:44.224
5069	130	CORRECT_SCORE	2:0	9.88	2026-06-11 12:34:44.224
5070	130	CORRECT_SCORE	2:1	7.54	2026-06-11 12:34:44.224
5071	130	CORRECT_SCORE	0:1	8.51	2026-06-11 12:34:44.224
5072	130	CORRECT_SCORE	0:0	8.10	2026-06-11 12:34:44.224
5073	131	X1X	home	1.90	2026-06-11 12:34:44.227
5074	131	X1X	draw	3.71	2026-06-11 12:34:44.227
5075	131	X1X	away	3.65	2026-06-11 12:34:44.227
5076	131	TOTAL_GOALS	0球	9.10	2026-06-11 12:34:44.227
5077	131	TOTAL_GOALS	1球	4.24	2026-06-11 12:34:44.227
5078	131	TOTAL_GOALS	2球	3.80	2026-06-11 12:34:44.227
5079	131	TOTAL_GOALS	3球+	1.98	2026-06-11 12:34:44.227
5080	131	CORRECT_SCORE	1:0	6.91	2026-06-11 12:34:44.227
5081	131	CORRECT_SCORE	1:1	5.89	2026-06-11 12:34:44.227
5082	131	CORRECT_SCORE	2:0	8.82	2026-06-11 12:34:44.227
5083	131	CORRECT_SCORE	2:1	7.91	2026-06-11 12:34:44.227
5084	131	CORRECT_SCORE	0:1	7.06	2026-06-11 12:34:44.227
5085	131	CORRECT_SCORE	0:0	8.23	2026-06-11 12:34:44.227
5086	132	X1X	home	3.44	2026-06-11 12:34:44.23
5087	132	X1X	draw	3.51	2026-06-11 12:34:44.23
5088	132	X1X	away	2.06	2026-06-11 12:34:44.23
5089	132	TOTAL_GOALS	0球	9.78	2026-06-11 12:34:44.23
5090	132	TOTAL_GOALS	1球	4.16	2026-06-11 12:34:44.23
5091	132	TOTAL_GOALS	2球	3.74	2026-06-11 12:34:44.23
5092	132	TOTAL_GOALS	3球+	2.02	2026-06-11 12:34:44.23
5093	132	CORRECT_SCORE	1:0	7.67	2026-06-11 12:34:44.23
5094	132	CORRECT_SCORE	1:1	5.16	2026-06-11 12:34:44.23
5095	132	CORRECT_SCORE	2:0	8.32	2026-06-11 12:34:44.23
5096	132	CORRECT_SCORE	2:1	8.50	2026-06-11 12:34:44.23
5097	132	CORRECT_SCORE	0:1	7.58	2026-06-11 12:34:44.23
5098	132	CORRECT_SCORE	0:0	7.41	2026-06-11 12:34:44.23
5099	133	X1X	home	2.37	2026-06-11 12:34:44.232
5100	133	X1X	draw	3.31	2026-06-11 12:34:44.232
5101	133	X1X	away	2.62	2026-06-11 12:34:44.232
5102	133	TOTAL_GOALS	0球	9.25	2026-06-11 12:34:44.232
5103	133	TOTAL_GOALS	1球	4.44	2026-06-11 12:34:44.232
5104	133	TOTAL_GOALS	2球	3.76	2026-06-11 12:34:44.232
5105	133	TOTAL_GOALS	3球+	2.41	2026-06-11 12:34:44.232
5106	133	CORRECT_SCORE	1:0	7.80	2026-06-11 12:34:44.232
5107	133	CORRECT_SCORE	1:1	5.08	2026-06-11 12:34:44.232
5108	133	CORRECT_SCORE	2:0	8.78	2026-06-11 12:34:44.232
5109	133	CORRECT_SCORE	2:1	7.65	2026-06-11 12:34:44.232
5110	133	CORRECT_SCORE	0:1	9.89	2026-06-11 12:34:44.232
5111	133	CORRECT_SCORE	0:0	8.58	2026-06-11 12:34:44.232
16049	159	HALF_FULL	平负	18.00	2026-06-12 10:53:25.164
16050	159	HALF_FULL	负胜	21.00	2026-06-12 10:53:25.164
16051	159	HALF_FULL	负平	21.00	2026-06-12 10:53:25.164
16052	159	HALF_FULL	负负	15.00	2026-06-12 10:53:25.164
16053	164	X1X	home	1.14	2026-06-12 10:53:25.168
16054	164	X1X	draw	5.70	2026-06-12 10:53:25.168
16055	164	X1X	away	13.00	2026-06-12 10:53:25.168
16056	164	HANDICAP_X1X	-2:home	2.74	2026-06-12 10:53:25.168
16057	164	HANDICAP_X1X	-2:draw	3.85	2026-06-12 10:53:25.168
16058	164	HANDICAP_X1X	-2:away	1.98	2026-06-12 10:53:25.168
16059	164	TOTAL_GOALS	0球	15.00	2026-06-12 10:53:25.168
16060	164	TOTAL_GOALS	1球	5.50	2026-06-12 10:53:25.168
16061	164	TOTAL_GOALS	2球	3.80	2026-06-12 10:53:25.168
16062	164	TOTAL_GOALS	3球	3.50	2026-06-12 10:53:25.168
16063	164	TOTAL_GOALS	4球	4.75	2026-06-12 10:53:25.168
16064	164	TOTAL_GOALS	5球	8.00	2026-06-12 10:53:25.168
16065	164	TOTAL_GOALS	6球	14.00	2026-06-12 10:53:25.168
16066	164	TOTAL_GOALS	7+	20.00	2026-06-12 10:53:25.168
16067	164	CORRECT_SCORE	1:0	5.80	2026-06-12 10:53:25.168
16068	164	CORRECT_SCORE	2:0	5.20	2026-06-12 10:53:25.168
16069	164	CORRECT_SCORE	2:1	7.50	2026-06-12 10:53:25.168
16070	164	CORRECT_SCORE	3:0	6.50	2026-06-12 10:53:25.168
16071	164	CORRECT_SCORE	3:1	10.00	2026-06-12 10:53:25.168
16072	164	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.168
16073	164	CORRECT_SCORE	4:0	10.50	2026-06-12 10:53:25.168
16074	164	CORRECT_SCORE	4:1	17.00	2026-06-12 10:53:25.168
5138	136	X1X	home	2.01	2026-06-11 12:34:44.239
5139	136	X1X	draw	3.01	2026-06-11 12:34:44.239
5140	136	X1X	away	2.77	2026-06-11 12:34:44.239
5141	136	TOTAL_GOALS	0球	9.43	2026-06-11 12:34:44.239
5142	136	TOTAL_GOALS	1球	4.55	2026-06-11 12:34:44.239
5143	136	TOTAL_GOALS	2球	3.51	2026-06-11 12:34:44.239
5144	136	TOTAL_GOALS	3球+	2.42	2026-06-11 12:34:44.239
5145	136	CORRECT_SCORE	1:0	7.74	2026-06-11 12:34:44.239
5146	136	CORRECT_SCORE	1:1	6.05	2026-06-11 12:34:44.239
5147	136	CORRECT_SCORE	2:0	9.30	2026-06-11 12:34:44.239
5148	136	CORRECT_SCORE	2:1	7.80	2026-06-11 12:34:44.239
5149	136	CORRECT_SCORE	0:1	7.23	2026-06-11 12:34:44.239
5150	136	CORRECT_SCORE	0:0	8.64	2026-06-11 12:34:44.239
5151	137	X1X	home	2.14	2026-06-11 12:34:44.241
5152	137	X1X	draw	3.30	2026-06-11 12:34:44.241
5153	137	X1X	away	2.88	2026-06-11 12:34:44.241
5154	137	TOTAL_GOALS	0球	8.99	2026-06-11 12:34:44.241
5155	137	TOTAL_GOALS	1球	4.13	2026-06-11 12:34:44.241
5156	137	TOTAL_GOALS	2球	3.69	2026-06-11 12:34:44.241
5157	137	TOTAL_GOALS	3球+	2.06	2026-06-11 12:34:44.241
5158	137	CORRECT_SCORE	1:0	6.09	2026-06-11 12:34:44.241
5159	137	CORRECT_SCORE	1:1	5.33	2026-06-11 12:34:44.241
5160	137	CORRECT_SCORE	2:0	8.99	2026-06-11 12:34:44.241
5161	137	CORRECT_SCORE	2:1	7.01	2026-06-11 12:34:44.241
5162	137	CORRECT_SCORE	0:1	9.30	2026-06-11 12:34:44.241
5163	137	CORRECT_SCORE	0:0	8.18	2026-06-11 12:34:44.241
5164	138	X1X	home	2.44	2026-06-11 12:34:44.243
5165	138	X1X	draw	3.27	2026-06-11 12:34:44.243
5166	138	X1X	away	2.42	2026-06-11 12:34:44.243
5167	138	TOTAL_GOALS	0球	9.26	2026-06-11 12:34:44.243
5168	138	TOTAL_GOALS	1球	4.40	2026-06-11 12:34:44.243
5169	138	TOTAL_GOALS	2球	3.04	2026-06-11 12:34:44.243
5170	138	TOTAL_GOALS	3球+	2.30	2026-06-11 12:34:44.243
5171	138	CORRECT_SCORE	1:0	7.25	2026-06-11 12:34:44.243
5172	138	CORRECT_SCORE	1:1	5.34	2026-06-11 12:34:44.243
5173	138	CORRECT_SCORE	2:0	10.45	2026-06-11 12:34:44.243
5174	138	CORRECT_SCORE	2:1	7.26	2026-06-11 12:34:44.243
5175	138	CORRECT_SCORE	0:1	8.81	2026-06-11 12:34:44.243
5176	138	CORRECT_SCORE	0:0	7.63	2026-06-11 12:34:44.243
5177	139	X1X	home	2.66	2026-06-11 12:34:44.245
5178	139	X1X	draw	3.43	2026-06-11 12:34:44.245
5179	139	X1X	away	3.62	2026-06-11 12:34:44.245
5180	139	TOTAL_GOALS	0球	9.32	2026-06-11 12:34:44.245
5181	139	TOTAL_GOALS	1球	4.98	2026-06-11 12:34:44.245
5182	139	TOTAL_GOALS	2球	3.16	2026-06-11 12:34:44.245
5183	139	TOTAL_GOALS	3球+	2.49	2026-06-11 12:34:44.245
5184	139	CORRECT_SCORE	1:0	7.66	2026-06-11 12:34:44.245
5185	139	CORRECT_SCORE	1:1	5.40	2026-06-11 12:34:44.245
5186	139	CORRECT_SCORE	2:0	8.02	2026-06-11 12:34:44.245
5187	139	CORRECT_SCORE	2:1	7.54	2026-06-11 12:34:44.245
5188	139	CORRECT_SCORE	0:1	8.74	2026-06-11 12:34:44.245
5189	139	CORRECT_SCORE	0:0	7.97	2026-06-11 12:34:44.245
16075	164	CORRECT_SCORE	4:2	60.00	2026-06-12 10:53:25.168
16076	164	CORRECT_SCORE	5:0	21.00	2026-06-12 10:53:25.168
16077	164	CORRECT_SCORE	5:1	35.00	2026-06-12 10:53:25.168
16078	164	CORRECT_SCORE	5:2	100.00	2026-06-12 10:53:25.168
16079	164	CORRECT_SCORE	胜其它	18.00	2026-06-12 10:53:25.168
16080	164	CORRECT_SCORE	0:0	15.00	2026-06-12 10:53:25.168
16081	164	CORRECT_SCORE	1:1	10.00	2026-06-12 10:53:25.168
16082	164	CORRECT_SCORE	2:2	29.00	2026-06-12 10:53:25.168
16083	164	CORRECT_SCORE	3:3	175.00	2026-06-12 10:53:25.168
16084	164	CORRECT_SCORE	平其它	700.00	2026-06-12 10:53:25.168
16085	164	CORRECT_SCORE	0:1	26.00	2026-06-12 10:53:25.168
16086	164	CORRECT_SCORE	0:2	90.00	2026-06-12 10:53:25.168
16087	164	CORRECT_SCORE	1:2	35.00	2026-06-12 10:53:25.168
16088	164	CORRECT_SCORE	0:3	350.00	2026-06-12 10:53:25.168
16089	164	CORRECT_SCORE	1:3	175.00	2026-06-12 10:53:25.168
16090	164	CORRECT_SCORE	2:3	150.00	2026-06-12 10:53:25.168
16091	164	CORRECT_SCORE	0:4	1000.00	2026-06-12 10:53:25.168
16092	164	CORRECT_SCORE	1:4	600.00	2026-06-12 10:53:25.168
16093	164	CORRECT_SCORE	2:4	500.00	2026-06-12 10:53:25.168
16094	164	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.168
16095	164	CORRECT_SCORE	1:5	1000.00	2026-06-12 10:53:25.168
16096	164	CORRECT_SCORE	2:5	1000.00	2026-06-12 10:53:25.168
16097	164	CORRECT_SCORE	负其它	500.00	2026-06-12 10:53:25.168
16098	164	HALF_FULL	胜胜	1.60	2026-06-12 10:53:25.168
16099	164	HALF_FULL	胜平	25.00	2026-06-12 10:53:25.168
16100	164	HALF_FULL	胜负	85.00	2026-06-12 10:53:25.168
5216	142	X1X	home	1.83	2026-06-11 12:34:44.253
5217	142	X1X	draw	3.23	2026-06-11 12:34:44.253
5218	142	X1X	away	3.75	2026-06-11 12:34:44.253
5219	142	TOTAL_GOALS	0球	8.72	2026-06-11 12:34:44.253
5220	142	TOTAL_GOALS	1球	5.00	2026-06-11 12:34:44.253
5221	142	TOTAL_GOALS	2球	3.46	2026-06-11 12:34:44.253
5222	142	TOTAL_GOALS	3球+	2.29	2026-06-11 12:34:44.253
5223	142	CORRECT_SCORE	1:0	6.98	2026-06-11 12:34:44.253
5224	142	CORRECT_SCORE	1:1	6.16	2026-06-11 12:34:44.253
5225	142	CORRECT_SCORE	2:0	8.24	2026-06-11 12:34:44.253
5226	142	CORRECT_SCORE	2:1	7.96	2026-06-11 12:34:44.253
5227	142	CORRECT_SCORE	0:1	7.77	2026-06-11 12:34:44.253
5228	142	CORRECT_SCORE	0:0	7.16	2026-06-11 12:34:44.253
5229	143	X1X	home	3.11	2026-06-11 12:34:44.256
5230	143	X1X	draw	3.31	2026-06-11 12:34:44.256
5231	143	X1X	away	3.10	2026-06-11 12:34:44.256
5232	143	TOTAL_GOALS	0球	9.49	2026-06-11 12:34:44.256
5233	143	TOTAL_GOALS	1球	4.40	2026-06-11 12:34:44.256
5234	143	TOTAL_GOALS	2球	3.29	2026-06-11 12:34:44.256
5235	143	TOTAL_GOALS	3球+	2.13	2026-06-11 12:34:44.256
5236	143	CORRECT_SCORE	1:0	7.17	2026-06-11 12:34:44.256
5237	143	CORRECT_SCORE	1:1	6.42	2026-06-11 12:34:44.256
5238	143	CORRECT_SCORE	2:0	8.90	2026-06-11 12:34:44.256
5239	143	CORRECT_SCORE	2:1	7.45	2026-06-11 12:34:44.256
5240	143	CORRECT_SCORE	0:1	7.63	2026-06-11 12:34:44.256
5241	143	CORRECT_SCORE	0:0	7.49	2026-06-11 12:34:44.256
5242	144	X1X	home	2.78	2026-06-11 12:34:44.258
5243	144	X1X	draw	3.19	2026-06-11 12:34:44.258
5244	144	X1X	away	2.24	2026-06-11 12:34:44.258
5245	144	TOTAL_GOALS	0球	9.83	2026-06-11 12:34:44.258
5246	144	TOTAL_GOALS	1球	4.90	2026-06-11 12:34:44.258
5247	144	TOTAL_GOALS	2球	3.62	2026-06-11 12:34:44.258
5248	144	TOTAL_GOALS	3球+	2.51	2026-06-11 12:34:44.258
5249	144	CORRECT_SCORE	1:0	6.07	2026-06-11 12:34:44.258
5250	144	CORRECT_SCORE	1:1	6.26	2026-06-11 12:34:44.258
5251	144	CORRECT_SCORE	2:0	10.37	2026-06-11 12:34:44.258
5252	144	CORRECT_SCORE	2:1	8.35	2026-06-11 12:34:44.258
5253	144	CORRECT_SCORE	0:1	8.51	2026-06-11 12:34:44.258
5254	144	CORRECT_SCORE	0:0	8.91	2026-06-11 12:34:44.258
5255	145	X1X	home	2.77	2026-06-11 12:34:44.261
5256	145	X1X	draw	3.20	2026-06-11 12:34:44.261
5257	145	X1X	away	2.94	2026-06-11 12:34:44.261
5258	145	TOTAL_GOALS	0球	8.56	2026-06-11 12:34:44.261
5259	145	TOTAL_GOALS	1球	4.03	2026-06-11 12:34:44.261
5260	145	TOTAL_GOALS	2球	3.03	2026-06-11 12:34:44.261
5261	145	TOTAL_GOALS	3球+	2.26	2026-06-11 12:34:44.261
5262	145	CORRECT_SCORE	1:0	7.54	2026-06-11 12:34:44.261
5263	145	CORRECT_SCORE	1:1	6.04	2026-06-11 12:34:44.261
5264	145	CORRECT_SCORE	2:0	9.71	2026-06-11 12:34:44.261
5265	145	CORRECT_SCORE	2:1	8.84	2026-06-11 12:34:44.261
5266	145	CORRECT_SCORE	0:1	7.73	2026-06-11 12:34:44.261
5267	145	CORRECT_SCORE	0:0	8.14	2026-06-11 12:34:44.261
16101	164	HALF_FULL	平胜	3.50	2026-06-12 10:53:25.168
16102	164	HALF_FULL	平平	8.00	2026-06-12 10:53:25.168
16103	164	HALF_FULL	平负	25.00	2026-06-12 10:53:25.168
16104	164	HALF_FULL	负胜	27.00	2026-06-12 10:53:25.168
16105	164	HALF_FULL	负平	25.00	2026-06-12 10:53:25.168
16106	164	HALF_FULL	负负	20.00	2026-06-12 10:53:25.168
16107	170	X1X	home	1.55	2026-06-12 10:53:25.172
16108	170	X1X	draw	3.40	2026-06-12 10:53:25.172
16109	170	X1X	away	5.25	2026-06-12 10:53:25.172
16110	170	HANDICAP_X1X	-1:home	2.94	2026-06-12 10:53:25.172
16111	170	HANDICAP_X1X	-1:draw	3.20	2026-06-12 10:53:25.172
16112	170	HANDICAP_X1X	-1:away	2.10	2026-06-12 10:53:25.172
16113	170	TOTAL_GOALS	0球	9.50	2026-06-12 10:53:25.172
16114	170	TOTAL_GOALS	1球	4.20	2026-06-12 10:53:25.172
16115	170	TOTAL_GOALS	2球	3.10	2026-06-12 10:53:25.172
16116	170	TOTAL_GOALS	3球	3.70	2026-06-12 10:53:25.172
16117	170	TOTAL_GOALS	4球	6.20	2026-06-12 10:53:25.172
16118	170	TOTAL_GOALS	5球	12.00	2026-06-12 10:53:25.172
16119	170	TOTAL_GOALS	6球	22.00	2026-06-12 10:53:25.172
16120	170	TOTAL_GOALS	7+	35.00	2026-06-12 10:53:25.172
16121	170	CORRECT_SCORE	1:0	5.50	2026-06-12 10:53:25.172
16122	170	CORRECT_SCORE	2:0	6.40	2026-06-12 10:53:25.172
16123	170	CORRECT_SCORE	2:1	7.00	2026-06-12 10:53:25.172
16124	170	CORRECT_SCORE	3:0	11.50	2026-06-12 10:53:25.172
16125	170	CORRECT_SCORE	3:1	13.00	2026-06-12 10:53:25.172
16126	170	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.172
5294	148	X1X	home	3.29	2026-06-11 12:34:44.266
5295	148	X1X	draw	3.75	2026-06-11 12:34:44.266
5296	148	X1X	away	2.77	2026-06-11 12:34:44.266
5297	148	TOTAL_GOALS	0球	9.73	2026-06-11 12:34:44.266
5298	148	TOTAL_GOALS	1球	4.03	2026-06-11 12:34:44.266
5299	148	TOTAL_GOALS	2球	3.06	2026-06-11 12:34:44.266
5300	148	TOTAL_GOALS	3球+	2.56	2026-06-11 12:34:44.266
5301	148	CORRECT_SCORE	1:0	6.07	2026-06-11 12:34:44.266
5302	148	CORRECT_SCORE	1:1	5.38	2026-06-11 12:34:44.266
5303	148	CORRECT_SCORE	2:0	9.30	2026-06-11 12:34:44.266
5304	148	CORRECT_SCORE	2:1	8.94	2026-06-11 12:34:44.266
5305	148	CORRECT_SCORE	0:1	7.29	2026-06-11 12:34:44.266
5306	148	CORRECT_SCORE	0:0	7.57	2026-06-11 12:34:44.266
5307	149	X1X	home	3.27	2026-06-11 12:34:44.267
5308	149	X1X	draw	3.73	2026-06-11 12:34:44.267
5309	149	X1X	away	2.16	2026-06-11 12:34:44.267
5310	149	TOTAL_GOALS	0球	9.69	2026-06-11 12:34:44.267
5311	149	TOTAL_GOALS	1球	4.70	2026-06-11 12:34:44.267
5312	149	TOTAL_GOALS	2球	3.48	2026-06-11 12:34:44.267
5313	149	TOTAL_GOALS	3球+	2.31	2026-06-11 12:34:44.267
5314	149	CORRECT_SCORE	1:0	7.45	2026-06-11 12:34:44.267
5315	149	CORRECT_SCORE	1:1	5.58	2026-06-11 12:34:44.267
5316	149	CORRECT_SCORE	2:0	8.44	2026-06-11 12:34:44.267
5317	149	CORRECT_SCORE	2:1	8.18	2026-06-11 12:34:44.267
5318	149	CORRECT_SCORE	0:1	9.72	2026-06-11 12:34:44.267
5319	149	CORRECT_SCORE	0:0	8.34	2026-06-11 12:34:44.267
5320	150	X1X	home	2.37	2026-06-11 12:34:44.269
5321	150	X1X	draw	3.19	2026-06-11 12:34:44.269
5322	150	X1X	away	2.56	2026-06-11 12:34:44.269
5323	150	TOTAL_GOALS	0球	8.59	2026-06-11 12:34:44.269
5324	150	TOTAL_GOALS	1球	4.15	2026-06-11 12:34:44.269
5325	150	TOTAL_GOALS	2球	3.69	2026-06-11 12:34:44.269
5326	150	TOTAL_GOALS	3球+	1.85	2026-06-11 12:34:44.269
5327	150	CORRECT_SCORE	1:0	6.81	2026-06-11 12:34:44.269
5328	150	CORRECT_SCORE	1:1	5.51	2026-06-11 12:34:44.269
5329	150	CORRECT_SCORE	2:0	9.02	2026-06-11 12:34:44.269
5330	150	CORRECT_SCORE	2:1	8.60	2026-06-11 12:34:44.269
5331	150	CORRECT_SCORE	0:1	7.51	2026-06-11 12:34:44.269
5332	150	CORRECT_SCORE	0:0	7.13	2026-06-11 12:34:44.269
5333	151	X1X	home	2.80	2026-06-11 12:34:44.271
5334	151	X1X	draw	3.52	2026-06-11 12:34:44.271
5335	151	X1X	away	2.57	2026-06-11 12:34:44.271
5336	151	TOTAL_GOALS	0球	8.07	2026-06-11 12:34:44.271
5337	151	TOTAL_GOALS	1球	4.52	2026-06-11 12:34:44.271
5338	151	TOTAL_GOALS	2球	3.64	2026-06-11 12:34:44.271
5339	151	TOTAL_GOALS	3球+	1.97	2026-06-11 12:34:44.271
5340	151	CORRECT_SCORE	1:0	6.09	2026-06-11 12:34:44.271
5341	151	CORRECT_SCORE	1:1	5.12	2026-06-11 12:34:44.271
5342	151	CORRECT_SCORE	2:0	10.87	2026-06-11 12:34:44.271
5343	151	CORRECT_SCORE	2:1	8.07	2026-06-11 12:34:44.271
5344	151	CORRECT_SCORE	0:1	7.52	2026-06-11 12:34:44.271
5345	151	CORRECT_SCORE	0:0	7.51	2026-06-11 12:34:44.271
16127	170	CORRECT_SCORE	4:0	25.00	2026-06-12 10:53:25.172
16128	170	CORRECT_SCORE	4:1	30.00	2026-06-12 10:53:25.172
16129	170	CORRECT_SCORE	4:2	75.00	2026-06-12 10:53:25.172
16130	170	CORRECT_SCORE	5:0	75.00	2026-06-12 10:53:25.172
16131	170	CORRECT_SCORE	5:1	90.00	2026-06-12 10:53:25.172
16132	170	CORRECT_SCORE	5:2	200.00	2026-06-12 10:53:25.172
16133	170	CORRECT_SCORE	胜其它	60.00	2026-06-12 10:53:25.172
16134	170	CORRECT_SCORE	0:0	9.50	2026-06-12 10:53:25.172
16135	170	CORRECT_SCORE	1:1	6.00	2026-06-12 10:53:25.172
16136	170	CORRECT_SCORE	2:2	17.00	2026-06-12 10:53:25.172
16137	170	CORRECT_SCORE	3:3	100.00	2026-06-12 10:53:25.172
16138	170	CORRECT_SCORE	平其它	400.00	2026-06-12 10:53:25.172
16139	170	CORRECT_SCORE	0:1	11.00	2026-06-12 10:53:25.172
16140	170	CORRECT_SCORE	0:2	28.00	2026-06-12 10:53:25.172
16141	170	CORRECT_SCORE	1:2	14.00	2026-06-12 10:53:25.172
16142	170	CORRECT_SCORE	0:3	100.00	2026-06-12 10:53:25.172
16143	170	CORRECT_SCORE	1:3	60.00	2026-06-12 10:53:25.172
16144	170	CORRECT_SCORE	2:3	70.00	2026-06-12 10:53:25.172
16145	170	CORRECT_SCORE	0:4	400.00	2026-06-12 10:53:25.172
16146	170	CORRECT_SCORE	1:4	250.00	2026-06-12 10:53:25.172
16147	170	CORRECT_SCORE	2:4	300.00	2026-06-12 10:53:25.172
16148	170	CORRECT_SCORE	0:5	1000.00	2026-06-12 10:53:25.172
16149	170	CORRECT_SCORE	1:5	700.00	2026-06-12 10:53:25.172
16150	170	CORRECT_SCORE	2:5	700.00	2026-06-12 10:53:25.172
16151	170	CORRECT_SCORE	负其它	350.00	2026-06-12 10:53:25.172
16152	170	HALF_FULL	胜胜	2.35	2026-06-12 10:53:25.172
5372	154	X1X	home	2.40	2026-06-11 12:34:44.278
5373	154	X1X	draw	3.17	2026-06-11 12:34:44.278
5374	154	X1X	away	2.65	2026-06-11 12:34:44.278
5375	154	TOTAL_GOALS	0球	8.43	2026-06-11 12:34:44.278
5376	154	TOTAL_GOALS	1球	4.82	2026-06-11 12:34:44.278
5377	154	TOTAL_GOALS	2球	3.61	2026-06-11 12:34:44.278
5378	154	TOTAL_GOALS	3球+	2.35	2026-06-11 12:34:44.278
5379	154	CORRECT_SCORE	1:0	6.25	2026-06-11 12:34:44.278
5380	154	CORRECT_SCORE	1:1	6.20	2026-06-11 12:34:44.278
5381	154	CORRECT_SCORE	2:0	8.85	2026-06-11 12:34:44.278
5382	154	CORRECT_SCORE	2:1	8.96	2026-06-11 12:34:44.278
5383	154	CORRECT_SCORE	0:1	8.38	2026-06-11 12:34:44.278
5384	154	CORRECT_SCORE	0:0	7.40	2026-06-11 12:34:44.278
5385	155	X1X	home	1.93	2026-06-11 12:34:44.28
5386	155	X1X	draw	3.59	2026-06-11 12:34:44.28
5387	155	X1X	away	3.27	2026-06-11 12:34:44.28
5388	155	TOTAL_GOALS	0球	8.29	2026-06-11 12:34:44.28
5389	155	TOTAL_GOALS	1球	4.32	2026-06-11 12:34:44.28
5390	155	TOTAL_GOALS	2球	3.42	2026-06-11 12:34:44.28
5391	155	TOTAL_GOALS	3球+	2.39	2026-06-11 12:34:44.28
5392	155	CORRECT_SCORE	1:0	7.13	2026-06-11 12:34:44.28
5393	155	CORRECT_SCORE	1:1	6.26	2026-06-11 12:34:44.28
5394	155	CORRECT_SCORE	2:0	9.22	2026-06-11 12:34:44.28
5395	155	CORRECT_SCORE	2:1	7.92	2026-06-11 12:34:44.28
5396	155	CORRECT_SCORE	0:1	9.21	2026-06-11 12:34:44.28
5397	155	CORRECT_SCORE	0:0	8.89	2026-06-11 12:34:44.28
5398	156	X1X	home	2.62	2026-06-11 12:34:44.282
5399	156	X1X	draw	3.03	2026-06-11 12:34:44.282
5400	156	X1X	away	2.41	2026-06-11 12:34:44.282
5401	156	TOTAL_GOALS	0球	9.23	2026-06-11 12:34:44.282
5402	156	TOTAL_GOALS	1球	4.94	2026-06-11 12:34:44.282
5403	156	TOTAL_GOALS	2球	3.76	2026-06-11 12:34:44.282
5404	156	TOTAL_GOALS	3球+	2.51	2026-06-11 12:34:44.282
5405	156	CORRECT_SCORE	1:0	7.06	2026-06-11 12:34:44.282
5406	156	CORRECT_SCORE	1:1	6.09	2026-06-11 12:34:44.282
5407	156	CORRECT_SCORE	2:0	9.52	2026-06-11 12:34:44.282
5408	156	CORRECT_SCORE	2:1	8.68	2026-06-11 12:34:44.282
5409	156	CORRECT_SCORE	0:1	7.92	2026-06-11 12:34:44.282
5410	156	CORRECT_SCORE	0:0	8.97	2026-06-11 12:34:44.282
5411	157	X1X	home	2.58	2026-06-11 12:34:44.284
5412	157	X1X	draw	3.44	2026-06-11 12:34:44.284
5413	157	X1X	away	2.26	2026-06-11 12:34:44.284
5414	157	TOTAL_GOALS	0球	8.40	2026-06-11 12:34:44.284
5415	157	TOTAL_GOALS	1球	4.72	2026-06-11 12:34:44.284
5416	157	TOTAL_GOALS	2球	3.41	2026-06-11 12:34:44.284
5417	157	TOTAL_GOALS	3球+	2.54	2026-06-11 12:34:44.284
5418	157	CORRECT_SCORE	1:0	6.52	2026-06-11 12:34:44.284
5419	157	CORRECT_SCORE	1:1	5.73	2026-06-11 12:34:44.284
5420	157	CORRECT_SCORE	2:0	10.18	2026-06-11 12:34:44.284
5421	157	CORRECT_SCORE	2:1	7.63	2026-06-11 12:34:44.284
5422	157	CORRECT_SCORE	0:1	8.95	2026-06-11 12:34:44.284
5423	157	CORRECT_SCORE	0:0	7.85	2026-06-11 12:34:44.284
16153	170	HALF_FULL	胜平	18.00	2026-06-12 10:53:25.172
16154	170	HALF_FULL	胜负	50.00	2026-06-12 10:53:25.172
16155	170	HALF_FULL	平胜	4.00	2026-06-12 10:53:25.172
16156	170	HALF_FULL	平平	4.90	2026-06-12 10:53:25.172
16157	170	HALF_FULL	平负	10.50	2026-06-12 10:53:25.172
16158	170	HALF_FULL	负胜	27.00	2026-06-12 10:53:25.172
16159	170	HALF_FULL	负平	18.00	2026-06-12 10:53:25.172
16160	170	HALF_FULL	负负	9.00	2026-06-12 10:53:25.172
16161	171	X1X	home	1.93	2026-06-12 10:53:25.176
16162	171	X1X	draw	3.00	2026-06-12 10:53:25.176
16163	171	X1X	away	3.60	2026-06-12 10:53:25.176
16164	171	HANDICAP_X1X	-1:home	4.25	2026-06-12 10:53:25.176
16165	171	HANDICAP_X1X	-1:draw	3.40	2026-06-12 10:53:25.176
16166	171	HANDICAP_X1X	-1:away	1.67	2026-06-12 10:53:25.176
16167	171	TOTAL_GOALS	0球	8.00	2026-06-12 10:53:25.176
16168	171	TOTAL_GOALS	1球	3.90	2026-06-12 10:53:25.176
16169	171	TOTAL_GOALS	2球	3.05	2026-06-12 10:53:25.176
16170	171	TOTAL_GOALS	3球	3.80	2026-06-12 10:53:25.176
5450	160	X1X	home	2.77	2026-06-11 12:34:44.29
5451	160	X1X	draw	3.76	2026-06-11 12:34:44.29
5452	160	X1X	away	3.27	2026-06-11 12:34:44.29
5453	160	TOTAL_GOALS	0球	9.14	2026-06-11 12:34:44.29
5454	160	TOTAL_GOALS	1球	4.79	2026-06-11 12:34:44.29
5455	160	TOTAL_GOALS	2球	3.66	2026-06-11 12:34:44.29
5456	160	TOTAL_GOALS	3球+	1.95	2026-06-11 12:34:44.29
5457	160	CORRECT_SCORE	1:0	7.12	2026-06-11 12:34:44.29
5458	160	CORRECT_SCORE	1:1	5.85	2026-06-11 12:34:44.29
5459	160	CORRECT_SCORE	2:0	8.24	2026-06-11 12:34:44.29
5460	160	CORRECT_SCORE	2:1	7.87	2026-06-11 12:34:44.29
5461	160	CORRECT_SCORE	0:1	8.67	2026-06-11 12:34:44.29
5462	160	CORRECT_SCORE	0:0	8.55	2026-06-11 12:34:44.29
5463	161	X1X	home	3.35	2026-06-11 12:34:44.293
5464	161	X1X	draw	3.22	2026-06-11 12:34:44.293
5465	161	X1X	away	2.50	2026-06-11 12:34:44.293
5466	161	TOTAL_GOALS	0球	8.72	2026-06-11 12:34:44.293
5467	161	TOTAL_GOALS	1球	4.66	2026-06-11 12:34:44.293
5468	161	TOTAL_GOALS	2球	3.67	2026-06-11 12:34:44.293
5469	161	TOTAL_GOALS	3球+	2.18	2026-06-11 12:34:44.293
5470	161	CORRECT_SCORE	1:0	6.81	2026-06-11 12:34:44.293
5471	161	CORRECT_SCORE	1:1	6.15	2026-06-11 12:34:44.293
5472	161	CORRECT_SCORE	2:0	9.10	2026-06-11 12:34:44.293
5473	161	CORRECT_SCORE	2:1	8.09	2026-06-11 12:34:44.293
5474	161	CORRECT_SCORE	0:1	8.75	2026-06-11 12:34:44.293
5475	161	CORRECT_SCORE	0:0	7.58	2026-06-11 12:34:44.293
5476	162	X1X	home	3.45	2026-06-11 12:34:44.295
5477	162	X1X	draw	3.19	2026-06-11 12:34:44.295
5478	162	X1X	away	2.53	2026-06-11 12:34:44.295
5479	162	TOTAL_GOALS	0球	8.63	2026-06-11 12:34:44.295
5480	162	TOTAL_GOALS	1球	4.99	2026-06-11 12:34:44.295
5481	162	TOTAL_GOALS	2球	3.47	2026-06-11 12:34:44.295
5482	162	TOTAL_GOALS	3球+	2.47	2026-06-11 12:34:44.295
5483	162	CORRECT_SCORE	1:0	6.62	2026-06-11 12:34:44.295
5484	162	CORRECT_SCORE	1:1	6.17	2026-06-11 12:34:44.295
5485	162	CORRECT_SCORE	2:0	10.26	2026-06-11 12:34:44.295
5486	162	CORRECT_SCORE	2:1	8.29	2026-06-11 12:34:44.295
5487	162	CORRECT_SCORE	0:1	7.55	2026-06-11 12:34:44.295
5488	162	CORRECT_SCORE	0:0	7.13	2026-06-11 12:34:44.295
5489	163	X1X	home	3.00	2026-06-11 12:34:44.297
5490	163	X1X	draw	3.31	2026-06-11 12:34:44.297
5491	163	X1X	away	2.25	2026-06-11 12:34:44.297
5492	163	TOTAL_GOALS	0球	8.08	2026-06-11 12:34:44.297
5493	163	TOTAL_GOALS	1球	4.99	2026-06-11 12:34:44.297
5494	163	TOTAL_GOALS	2球	3.09	2026-06-11 12:34:44.297
5495	163	TOTAL_GOALS	3球+	2.38	2026-06-11 12:34:44.297
5496	163	CORRECT_SCORE	1:0	7.18	2026-06-11 12:34:44.297
5497	163	CORRECT_SCORE	1:1	5.79	2026-06-11 12:34:44.297
5498	163	CORRECT_SCORE	2:0	10.63	2026-06-11 12:34:44.297
5499	163	CORRECT_SCORE	2:1	7.67	2026-06-11 12:34:44.297
5500	163	CORRECT_SCORE	0:1	7.65	2026-06-11 12:34:44.297
5501	163	CORRECT_SCORE	0:0	7.45	2026-06-11 12:34:44.297
16171	171	TOTAL_GOALS	4球	6.80	2026-06-12 10:53:25.176
16172	171	TOTAL_GOALS	5球	14.00	2026-06-12 10:53:25.176
16173	171	TOTAL_GOALS	6球	26.00	2026-06-12 10:53:25.176
16174	171	TOTAL_GOALS	7+	40.00	2026-06-12 10:53:25.176
16175	171	CORRECT_SCORE	1:0	5.50	2026-06-12 10:53:25.176
16176	171	CORRECT_SCORE	2:0	8.00	2026-06-12 10:53:25.176
16177	171	CORRECT_SCORE	2:1	7.50	2026-06-12 10:53:25.176
16178	171	CORRECT_SCORE	3:0	16.00	2026-06-12 10:53:25.176
16179	171	CORRECT_SCORE	3:1	16.00	2026-06-12 10:53:25.176
16180	171	CORRECT_SCORE	3:2	30.00	2026-06-12 10:53:25.176
16181	171	CORRECT_SCORE	4:0	45.00	2026-06-12 10:53:25.176
16182	171	CORRECT_SCORE	4:1	45.00	2026-06-12 10:53:25.176
16183	171	CORRECT_SCORE	4:2	100.00	2026-06-12 10:53:25.176
16184	171	CORRECT_SCORE	5:0	150.00	2026-06-12 10:53:25.176
16185	171	CORRECT_SCORE	5:1	175.00	2026-06-12 10:53:25.176
16186	171	CORRECT_SCORE	5:2	300.00	2026-06-12 10:53:25.176
16187	171	CORRECT_SCORE	胜其它	100.00	2026-06-12 10:53:25.176
16188	171	CORRECT_SCORE	0:0	8.00	2026-06-12 10:53:25.176
16189	171	CORRECT_SCORE	1:1	5.50	2026-06-12 10:53:25.176
16190	171	CORRECT_SCORE	2:2	16.00	2026-06-12 10:53:25.176
16191	171	CORRECT_SCORE	3:3	100.00	2026-06-12 10:53:25.176
16192	171	CORRECT_SCORE	平其它	600.00	2026-06-12 10:53:25.176
16193	171	CORRECT_SCORE	0:1	9.00	2026-06-12 10:53:25.176
16194	171	CORRECT_SCORE	0:2	18.00	2026-06-12 10:53:25.176
16195	171	CORRECT_SCORE	1:2	11.00	2026-06-12 10:53:25.176
5528	166	X1X	home	2.67	2026-06-11 12:34:44.304
5529	166	X1X	draw	3.28	2026-06-11 12:34:44.304
5530	166	X1X	away	2.61	2026-06-11 12:34:44.304
5531	166	TOTAL_GOALS	0球	8.31	2026-06-11 12:34:44.304
5532	166	TOTAL_GOALS	1球	4.51	2026-06-11 12:34:44.304
5533	166	TOTAL_GOALS	2球	3.11	2026-06-11 12:34:44.304
5534	166	TOTAL_GOALS	3球+	2.57	2026-06-11 12:34:44.304
5535	166	CORRECT_SCORE	1:0	6.04	2026-06-11 12:34:44.304
5536	166	CORRECT_SCORE	1:1	5.07	2026-06-11 12:34:44.304
5537	166	CORRECT_SCORE	2:0	8.15	2026-06-11 12:34:44.304
5538	166	CORRECT_SCORE	2:1	7.78	2026-06-11 12:34:44.304
5539	166	CORRECT_SCORE	0:1	7.74	2026-06-11 12:34:44.304
5540	166	CORRECT_SCORE	0:0	8.01	2026-06-11 12:34:44.304
5541	167	X1X	home	2.27	2026-06-11 12:34:44.306
5542	167	X1X	draw	3.08	2026-06-11 12:34:44.306
5543	167	X1X	away	3.43	2026-06-11 12:34:44.306
5544	167	TOTAL_GOALS	0球	8.66	2026-06-11 12:34:44.306
5545	167	TOTAL_GOALS	1球	4.90	2026-06-11 12:34:44.306
5546	167	TOTAL_GOALS	2球	3.30	2026-06-11 12:34:44.306
5547	167	TOTAL_GOALS	3球+	2.60	2026-06-11 12:34:44.306
5548	167	CORRECT_SCORE	1:0	7.07	2026-06-11 12:34:44.306
5549	167	CORRECT_SCORE	1:1	6.48	2026-06-11 12:34:44.306
5550	167	CORRECT_SCORE	2:0	8.90	2026-06-11 12:34:44.306
5551	167	CORRECT_SCORE	2:1	7.84	2026-06-11 12:34:44.306
5552	167	CORRECT_SCORE	0:1	8.88	2026-06-11 12:34:44.306
5553	167	CORRECT_SCORE	0:0	8.08	2026-06-11 12:34:44.306
5554	168	X1X	home	3.56	2026-06-11 12:34:44.308
5555	168	X1X	draw	3.67	2026-06-11 12:34:44.308
5556	168	X1X	away	3.32	2026-06-11 12:34:44.308
5557	168	TOTAL_GOALS	0球	9.69	2026-06-11 12:34:44.308
5558	168	TOTAL_GOALS	1球	4.46	2026-06-11 12:34:44.308
5559	168	TOTAL_GOALS	2球	3.13	2026-06-11 12:34:44.308
5560	168	TOTAL_GOALS	3球+	2.48	2026-06-11 12:34:44.308
5561	168	CORRECT_SCORE	1:0	7.35	2026-06-11 12:34:44.308
5562	168	CORRECT_SCORE	1:1	5.29	2026-06-11 12:34:44.308
5563	168	CORRECT_SCORE	2:0	8.28	2026-06-11 12:34:44.308
5564	168	CORRECT_SCORE	2:1	8.59	2026-06-11 12:34:44.308
5565	168	CORRECT_SCORE	0:1	7.01	2026-06-11 12:34:44.308
5566	168	CORRECT_SCORE	0:0	8.75	2026-06-11 12:34:44.308
5567	169	X1X	home	2.15	2026-06-11 12:34:44.309
5568	169	X1X	draw	3.11	2026-06-11 12:34:44.309
5569	169	X1X	away	2.84	2026-06-11 12:34:44.309
5570	169	TOTAL_GOALS	0球	9.81	2026-06-11 12:34:44.309
5571	169	TOTAL_GOALS	1球	4.32	2026-06-11 12:34:44.309
5572	169	TOTAL_GOALS	2球	3.74	2026-06-11 12:34:44.309
5573	169	TOTAL_GOALS	3球+	2.14	2026-06-11 12:34:44.309
5574	169	CORRECT_SCORE	1:0	6.37	2026-06-11 12:34:44.309
5575	169	CORRECT_SCORE	1:1	6.14	2026-06-11 12:34:44.309
5576	169	CORRECT_SCORE	2:0	8.67	2026-06-11 12:34:44.309
5577	169	CORRECT_SCORE	2:1	7.70	2026-06-11 12:34:44.309
5578	169	CORRECT_SCORE	0:1	8.03	2026-06-11 12:34:44.309
5579	169	CORRECT_SCORE	0:0	8.94	2026-06-11 12:34:44.309
16196	171	CORRECT_SCORE	0:3	55.00	2026-06-12 10:53:25.176
16197	171	CORRECT_SCORE	1:3	35.00	2026-06-12 10:53:25.176
16198	171	CORRECT_SCORE	2:3	50.00	2026-06-12 10:53:25.176
16199	171	CORRECT_SCORE	0:4	200.00	2026-06-12 10:53:25.176
16200	171	CORRECT_SCORE	1:4	150.00	2026-06-12 10:53:25.176
16201	171	CORRECT_SCORE	2:4	200.00	2026-06-12 10:53:25.176
16202	171	CORRECT_SCORE	0:5	600.00	2026-06-12 10:53:25.176
16203	171	CORRECT_SCORE	1:5	500.00	2026-06-12 10:53:25.176
16204	171	CORRECT_SCORE	2:5	700.00	2026-06-12 10:53:25.176
16205	171	CORRECT_SCORE	负其它	300.00	2026-06-12 10:53:25.176
16206	171	HALF_FULL	胜胜	3.10	2026-06-12 10:53:25.176
16207	171	HALF_FULL	胜平	15.00	2026-06-12 10:53:25.176
16208	171	HALF_FULL	胜负	30.00	2026-06-12 10:53:25.176
16209	171	HALF_FULL	平胜	4.60	2026-06-12 10:53:25.176
16210	171	HALF_FULL	平平	4.50	2026-06-12 10:53:25.176
16211	171	HALF_FULL	平负	7.50	2026-06-12 10:53:25.176
16212	171	HALF_FULL	负胜	26.00	2026-06-12 10:53:25.176
16213	171	HALF_FULL	负平	15.00	2026-06-12 10:53:25.176
16214	171	HALF_FULL	负负	6.50	2026-06-12 10:53:25.176
16215	165	X1X	home	9.10	2026-06-12 10:53:25.179
16216	165	X1X	draw	4.55	2026-06-12 10:53:25.179
16217	165	X1X	away	1.25	2026-06-12 10:53:25.179
16218	165	HANDICAP_X1X	1:home	3.12	2026-06-12 10:53:25.179
5606	172	X1X	home	1.94	2026-06-11 12:34:44.315
5607	172	X1X	draw	3.52	2026-06-11 12:34:44.315
5608	172	X1X	away	3.61	2026-06-11 12:34:44.315
5609	172	TOTAL_GOALS	0球	8.38	2026-06-11 12:34:44.315
5610	172	TOTAL_GOALS	1球	4.50	2026-06-11 12:34:44.315
5611	172	TOTAL_GOALS	2球	3.44	2026-06-11 12:34:44.315
5612	172	TOTAL_GOALS	3球+	2.33	2026-06-11 12:34:44.315
5613	172	CORRECT_SCORE	1:0	7.44	2026-06-11 12:34:44.315
5614	172	CORRECT_SCORE	1:1	5.51	2026-06-11 12:34:44.315
5615	172	CORRECT_SCORE	2:0	10.69	2026-06-11 12:34:44.315
5616	172	CORRECT_SCORE	2:1	8.89	2026-06-11 12:34:44.315
5617	172	CORRECT_SCORE	0:1	9.74	2026-06-11 12:34:44.315
5618	172	CORRECT_SCORE	0:0	7.03	2026-06-11 12:34:44.315
5619	173	X1X	home	3.48	2026-06-11 12:34:44.316
5620	173	X1X	draw	3.47	2026-06-11 12:34:44.316
5621	173	X1X	away	2.40	2026-06-11 12:34:44.316
5622	173	TOTAL_GOALS	0球	8.93	2026-06-11 12:34:44.316
5623	173	TOTAL_GOALS	1球	4.69	2026-06-11 12:34:44.316
5624	173	TOTAL_GOALS	2球	3.61	2026-06-11 12:34:44.316
5625	173	TOTAL_GOALS	3球+	2.49	2026-06-11 12:34:44.316
5626	173	CORRECT_SCORE	1:0	6.78	2026-06-11 12:34:44.316
5627	173	CORRECT_SCORE	1:1	6.40	2026-06-11 12:34:44.316
5628	173	CORRECT_SCORE	2:0	9.95	2026-06-11 12:34:44.316
5629	173	CORRECT_SCORE	2:1	7.30	2026-06-11 12:34:44.316
5630	173	CORRECT_SCORE	0:1	8.54	2026-06-11 12:34:44.316
5631	173	CORRECT_SCORE	0:0	8.62	2026-06-11 12:34:44.316
5632	174	X1X	home	3.22	2026-06-11 12:34:44.318
5633	174	X1X	draw	3.33	2026-06-11 12:34:44.318
5634	174	X1X	away	3.08	2026-06-11 12:34:44.318
5635	174	TOTAL_GOALS	0球	8.60	2026-06-11 12:34:44.318
5636	174	TOTAL_GOALS	1球	4.60	2026-06-11 12:34:44.318
5637	174	TOTAL_GOALS	2球	3.57	2026-06-11 12:34:44.318
5638	174	TOTAL_GOALS	3球+	2.06	2026-06-11 12:34:44.318
5639	174	CORRECT_SCORE	1:0	6.29	2026-06-11 12:34:44.318
5640	174	CORRECT_SCORE	1:1	6.18	2026-06-11 12:34:44.318
5641	174	CORRECT_SCORE	2:0	8.76	2026-06-11 12:34:44.318
5642	174	CORRECT_SCORE	2:1	7.03	2026-06-11 12:34:44.318
5643	174	CORRECT_SCORE	0:1	7.71	2026-06-11 12:34:44.318
5644	174	CORRECT_SCORE	0:0	7.42	2026-06-11 12:34:44.318
5645	175	X1X	home	2.21	2026-06-11 12:34:44.32
5646	175	X1X	draw	3.78	2026-06-11 12:34:44.32
5647	175	X1X	away	2.17	2026-06-11 12:34:44.32
5648	175	TOTAL_GOALS	0球	8.63	2026-06-11 12:34:44.32
5649	175	TOTAL_GOALS	1球	4.64	2026-06-11 12:34:44.32
5650	175	TOTAL_GOALS	2球	3.45	2026-06-11 12:34:44.32
5651	175	TOTAL_GOALS	3球+	2.38	2026-06-11 12:34:44.32
5652	175	CORRECT_SCORE	1:0	7.02	2026-06-11 12:34:44.32
5653	175	CORRECT_SCORE	1:1	6.48	2026-06-11 12:34:44.32
5654	175	CORRECT_SCORE	2:0	8.72	2026-06-11 12:34:44.32
5655	175	CORRECT_SCORE	2:1	8.29	2026-06-11 12:34:44.32
5656	175	CORRECT_SCORE	0:1	7.27	2026-06-11 12:34:44.32
5657	175	CORRECT_SCORE	0:0	8.35	2026-06-11 12:34:44.32
5658	104	X1X	home	1.26	2026-06-11 12:34:51.617
5659	104	X1X	draw	4.45	2026-06-11 12:34:51.617
5660	104	X1X	away	9.00	2026-06-11 12:34:51.617
5661	104	HANDICAP_X1X	-1:home	2.00	2026-06-11 12:34:51.617
5662	104	HANDICAP_X1X	-1:draw	3.25	2026-06-11 12:34:51.617
5663	104	HANDICAP_X1X	-1:away	3.11	2026-06-11 12:34:51.617
5664	104	TOTAL_GOALS	0球	9.50	2026-06-11 12:34:51.617
5665	104	TOTAL_GOALS	1球	4.40	2026-06-11 12:34:51.617
5666	104	TOTAL_GOALS	2球	3.20	2026-06-11 12:34:51.617
5667	104	TOTAL_GOALS	3球	3.60	2026-06-11 12:34:51.617
5668	104	TOTAL_GOALS	4球	6.05	2026-06-11 12:34:51.617
5669	104	TOTAL_GOALS	5球	12.00	2026-06-11 12:34:51.617
5670	104	TOTAL_GOALS	6球	20.00	2026-06-11 12:34:51.617
5671	104	TOTAL_GOALS	7+	30.00	2026-06-11 12:34:51.617
5672	104	CORRECT_SCORE	1:0	5.60	2026-06-11 12:34:51.617
5673	104	CORRECT_SCORE	2:0	4.50	2026-06-11 12:34:51.617
5674	104	CORRECT_SCORE	2:1	6.00	2026-06-11 12:34:51.617
5675	104	CORRECT_SCORE	3:0	8.00	2026-06-11 12:34:51.617
5676	104	CORRECT_SCORE	3:1	10.50	2026-06-11 12:34:51.617
5677	104	CORRECT_SCORE	3:2	37.00	2026-06-11 12:34:51.617
5678	104	CORRECT_SCORE	4:0	20.00	2026-06-11 12:34:51.617
5679	104	CORRECT_SCORE	4:1	27.00	2026-06-11 12:34:51.617
5680	104	CORRECT_SCORE	4:2	70.00	2026-06-11 12:34:51.617
5681	104	CORRECT_SCORE	5:0	50.00	2026-06-11 12:34:51.617
5682	104	CORRECT_SCORE	5:1	65.00	2026-06-11 12:34:51.617
5683	104	CORRECT_SCORE	5:2	150.00	2026-06-11 12:34:51.617
5684	104	CORRECT_SCORE	胜其它	50.00	2026-06-11 12:34:51.617
5685	104	CORRECT_SCORE	0:0	9.50	2026-06-11 12:34:51.617
5686	104	CORRECT_SCORE	1:1	7.25	2026-06-11 12:34:51.617
5687	104	CORRECT_SCORE	2:2	23.00	2026-06-11 12:34:51.617
5688	104	CORRECT_SCORE	3:3	125.00	2026-06-11 12:34:51.617
5689	104	CORRECT_SCORE	平其它	500.00	2026-06-11 12:34:51.617
5690	104	CORRECT_SCORE	0:1	18.00	2026-06-11 12:34:51.617
5691	104	CORRECT_SCORE	0:2	60.00	2026-06-11 12:34:51.617
5692	104	CORRECT_SCORE	1:2	30.00	2026-06-11 12:34:51.617
5693	104	CORRECT_SCORE	0:3	250.00	2026-06-11 12:34:51.617
5694	104	CORRECT_SCORE	1:3	160.00	2026-06-11 12:34:51.617
5695	104	CORRECT_SCORE	2:3	120.00	2026-06-11 12:34:51.617
5696	104	CORRECT_SCORE	0:4	600.00	2026-06-11 12:34:51.617
5697	104	CORRECT_SCORE	1:4	600.00	2026-06-11 12:34:51.617
5698	104	CORRECT_SCORE	2:4	600.00	2026-06-11 12:34:51.617
5699	104	CORRECT_SCORE	0:5	800.00	2026-06-11 12:34:51.617
5700	104	CORRECT_SCORE	1:5	800.00	2026-06-11 12:34:51.617
5701	104	CORRECT_SCORE	2:5	800.00	2026-06-11 12:34:51.617
5702	104	CORRECT_SCORE	负其它	600.00	2026-06-11 12:34:51.617
5703	104	HALF_FULL	胜胜	1.83	2026-06-11 12:34:51.617
5704	104	HALF_FULL	胜平	19.00	2026-06-11 12:34:51.617
5705	104	HALF_FULL	胜负	60.00	2026-06-11 12:34:51.617
5706	104	HALF_FULL	平胜	3.80	2026-06-11 12:34:51.617
5707	104	HALF_FULL	平平	6.05	2026-06-11 12:34:51.617
5708	104	HALF_FULL	平负	17.00	2026-06-11 12:34:51.617
5709	104	HALF_FULL	负胜	28.00	2026-06-11 12:34:51.617
5710	104	HALF_FULL	负平	19.00	2026-06-11 12:34:51.617
5711	104	HALF_FULL	负负	16.00	2026-06-11 12:34:51.617
5712	105	X1X	home	2.40	2026-06-11 12:34:51.625
5713	105	X1X	draw	2.86	2026-06-11 12:34:51.625
5714	105	X1X	away	2.76	2026-06-11 12:34:51.625
5715	105	HANDICAP_X1X	-1:home	5.70	2026-06-11 12:34:51.625
5716	105	HANDICAP_X1X	-1:draw	4.00	2026-06-11 12:34:51.625
5717	105	HANDICAP_X1X	-1:away	1.42	2026-06-11 12:34:51.625
5718	105	TOTAL_GOALS	0球	8.50	2026-06-11 12:34:51.625
5719	105	TOTAL_GOALS	1球	4.10	2026-06-11 12:34:51.625
5720	105	TOTAL_GOALS	2球	3.00	2026-06-11 12:34:51.625
5721	105	TOTAL_GOALS	3球	3.75	2026-06-11 12:34:51.625
5722	105	TOTAL_GOALS	4球	6.50	2026-06-11 12:34:51.625
5723	105	TOTAL_GOALS	5球	14.00	2026-06-11 12:34:51.625
5724	105	TOTAL_GOALS	6球	25.00	2026-06-11 12:34:51.625
5725	105	TOTAL_GOALS	7+	36.00	2026-06-11 12:34:51.625
5726	105	CORRECT_SCORE	1:0	7.25	2026-06-11 12:34:51.625
5727	105	CORRECT_SCORE	2:0	12.00	2026-06-11 12:34:51.625
5728	105	CORRECT_SCORE	2:1	7.50	2026-06-11 12:34:51.625
5729	105	CORRECT_SCORE	3:0	30.00	2026-06-11 12:34:51.625
5730	105	CORRECT_SCORE	3:1	25.00	2026-06-11 12:34:51.625
5731	105	CORRECT_SCORE	3:2	40.00	2026-06-11 12:34:51.625
5732	105	CORRECT_SCORE	4:0	100.00	2026-06-11 12:34:51.625
5733	105	CORRECT_SCORE	4:1	85.00	2026-06-11 12:34:51.625
5734	105	CORRECT_SCORE	4:2	135.00	2026-06-11 12:34:51.625
5735	105	CORRECT_SCORE	5:0	450.00	2026-06-11 12:34:51.625
5736	105	CORRECT_SCORE	5:1	275.00	2026-06-11 12:34:51.625
5737	105	CORRECT_SCORE	5:2	400.00	2026-06-11 12:34:51.625
5738	105	CORRECT_SCORE	胜其它	150.00	2026-06-11 12:34:51.625
5739	105	CORRECT_SCORE	0:0	8.50	2026-06-11 12:34:51.625
5740	105	CORRECT_SCORE	1:1	4.25	2026-06-11 12:34:51.625
5741	105	CORRECT_SCORE	2:2	12.50	2026-06-11 12:34:51.625
5742	105	CORRECT_SCORE	3:3	65.00	2026-06-11 12:34:51.625
5743	105	CORRECT_SCORE	平其它	350.00	2026-06-11 12:34:51.625
5744	105	CORRECT_SCORE	0:1	7.50	2026-06-11 12:34:51.625
5745	105	CORRECT_SCORE	0:2	13.50	2026-06-11 12:34:51.625
5746	105	CORRECT_SCORE	1:2	8.00	2026-06-11 12:34:51.625
5747	105	CORRECT_SCORE	0:3	33.00	2026-06-11 12:34:51.625
5748	105	CORRECT_SCORE	1:3	28.00	2026-06-11 12:34:51.625
5749	105	CORRECT_SCORE	2:3	42.00	2026-06-11 12:34:51.625
5750	105	CORRECT_SCORE	0:4	110.00	2026-06-11 12:34:51.625
5751	105	CORRECT_SCORE	1:4	90.00	2026-06-11 12:34:51.625
5752	105	CORRECT_SCORE	2:4	150.00	2026-06-11 12:34:51.625
5753	105	CORRECT_SCORE	0:5	500.00	2026-06-11 12:34:51.625
5754	105	CORRECT_SCORE	1:5	350.00	2026-06-11 12:34:51.625
5755	105	CORRECT_SCORE	2:5	500.00	2026-06-11 12:34:51.625
5756	105	CORRECT_SCORE	负其它	200.00	2026-06-11 12:34:51.625
5757	105	HALF_FULL	胜胜	4.20	2026-06-11 12:34:51.625
5758	105	HALF_FULL	胜平	14.00	2026-06-11 12:34:51.625
5759	105	HALF_FULL	胜负	29.00	2026-06-11 12:34:51.625
5760	105	HALF_FULL	平胜	5.50	2026-06-11 12:34:51.625
5761	105	HALF_FULL	平平	4.40	2026-06-11 12:34:51.625
5762	105	HALF_FULL	平负	5.85	2026-06-11 12:34:51.625
5763	105	HALF_FULL	负胜	28.00	2026-06-11 12:34:51.625
5764	105	HALF_FULL	负平	14.00	2026-06-11 12:34:51.625
5765	105	HALF_FULL	负负	4.50	2026-06-11 12:34:51.625
16219	165	HANDICAP_X1X	1:draw	3.35	2026-06-12 10:53:25.179
16220	165	HANDICAP_X1X	1:away	1.96	2026-06-12 10:53:25.179
16221	165	TOTAL_GOALS	0球	11.00	2026-06-12 10:53:25.179
16222	165	TOTAL_GOALS	1球	4.40	2026-06-12 10:53:25.179
16223	165	TOTAL_GOALS	2球	3.25	2026-06-12 10:53:25.179
16224	165	TOTAL_GOALS	3球	3.60	2026-06-12 10:53:25.179
16225	165	TOTAL_GOALS	4球	5.70	2026-06-12 10:53:25.179
16226	165	TOTAL_GOALS	5球	11.00	2026-06-12 10:53:25.179
16227	165	TOTAL_GOALS	6球	20.00	2026-06-12 10:53:25.179
16228	165	TOTAL_GOALS	7+	29.00	2026-06-12 10:53:25.179
16229	165	CORRECT_SCORE	1:0	16.00	2026-06-12 10:53:25.179
16230	165	CORRECT_SCORE	2:0	50.00	2026-06-12 10:53:25.179
16231	165	CORRECT_SCORE	2:1	25.00	2026-06-12 10:53:25.179
16232	165	CORRECT_SCORE	3:0	250.00	2026-06-12 10:53:25.179
16233	165	CORRECT_SCORE	3:1	120.00	2026-06-12 10:53:25.179
16234	165	CORRECT_SCORE	3:2	120.00	2026-06-12 10:53:25.179
16235	165	CORRECT_SCORE	4:0	600.00	2026-06-12 10:53:25.179
16236	165	CORRECT_SCORE	4:1	500.00	2026-06-12 10:53:25.179
16237	165	CORRECT_SCORE	4:2	500.00	2026-06-12 10:53:25.179
16238	165	CORRECT_SCORE	5:0	1000.00	2026-06-12 10:53:25.179
16239	165	CORRECT_SCORE	5:1	1000.00	2026-06-12 10:53:25.179
16240	165	CORRECT_SCORE	5:2	1000.00	2026-06-12 10:53:25.179
16241	165	CORRECT_SCORE	胜其它	500.00	2026-06-12 10:53:25.179
16242	165	CORRECT_SCORE	0:0	11.00	2026-06-12 10:53:25.179
16243	165	CORRECT_SCORE	1:1	8.00	2026-06-12 10:53:25.179
16244	165	CORRECT_SCORE	2:2	25.00	2026-06-12 10:53:25.179
16245	165	CORRECT_SCORE	3:3	150.00	2026-06-12 10:53:25.179
16246	165	CORRECT_SCORE	平其它	800.00	2026-06-12 10:53:25.179
16247	165	CORRECT_SCORE	0:1	5.20	2026-06-12 10:53:25.179
16248	165	CORRECT_SCORE	0:2	5.20	2026-06-12 10:53:25.179
16249	165	CORRECT_SCORE	1:2	7.00	2026-06-12 10:53:25.179
16250	165	CORRECT_SCORE	0:3	7.50	2026-06-12 10:53:25.179
16251	165	CORRECT_SCORE	1:3	11.00	2026-06-12 10:53:25.179
16252	165	CORRECT_SCORE	2:3	35.00	2026-06-12 10:53:25.179
16253	165	CORRECT_SCORE	0:4	14.00	2026-06-12 10:53:25.179
16254	165	CORRECT_SCORE	1:4	23.00	2026-06-12 10:53:25.179
16255	165	CORRECT_SCORE	2:4	70.00	2026-06-12 10:53:25.179
16256	165	CORRECT_SCORE	0:5	30.00	2026-06-12 10:53:25.179
16257	165	CORRECT_SCORE	1:5	55.00	2026-06-12 10:53:25.179
16258	165	CORRECT_SCORE	2:5	175.00	2026-06-12 10:53:25.179
16259	165	CORRECT_SCORE	负其它	40.00	2026-06-12 10:53:25.179
16260	165	HALF_FULL	胜胜	16.00	2026-06-12 10:53:25.179
16261	165	HALF_FULL	胜平	22.00	2026-06-12 10:53:25.179
16262	165	HALF_FULL	胜负	27.00	2026-06-12 10:53:25.179
16263	165	HALF_FULL	平胜	18.00	2026-06-12 10:53:25.179
16264	165	HALF_FULL	平平	6.00	2026-06-12 10:53:25.179
16265	165	HALF_FULL	平负	3.50	2026-06-12 10:53:25.179
16266	165	HALF_FULL	负胜	65.00	2026-06-12 10:53:25.179
16267	165	HALF_FULL	负平	22.00	2026-06-12 10:53:25.179
16268	165	HALF_FULL	负负	1.85	2026-06-12 10:53:25.179
15210	111	HANDICAP_X1X	2:home	2.08	2026-06-12 10:53:39.017
15211	111	HANDICAP_X1X	2:draw	4.75	2026-06-12 10:53:39.02
15212	111	HANDICAP_X1X	2:away	2.62	2026-06-12 10:53:39.02
15252	111	HALF_FULL	胜胜	25.00	2026-06-12 10:53:39.021
15253	111	HALF_FULL	胜平	27.00	2026-06-12 10:53:39.022
15254	111	HALF_FULL	胜负	29.00	2026-06-12 10:53:39.022
15255	111	HALF_FULL	平胜	27.00	2026-06-12 10:53:39.023
15256	111	HALF_FULL	平平	8.50	2026-06-12 10:53:39.023
15257	111	HALF_FULL	平负	3.70	2026-06-12 10:53:39.024
15258	111	HALF_FULL	负胜	100.00	2026-06-12 10:53:39.025
15259	111	HALF_FULL	负平	27.00	2026-06-12 10:53:39.025
15260	111	HALF_FULL	负负	1.49	2026-06-12 10:53:39.026
15213	111	TOTAL_GOALS	0球	16.00	2026-06-12 10:53:39.028
15214	111	TOTAL_GOALS	1球	5.70	2026-06-12 10:53:39.029
15215	111	TOTAL_GOALS	2球	3.85	2026-06-12 10:53:39.03
15216	111	TOTAL_GOALS	3球	3.50	2026-06-12 10:53:39.031
15217	111	TOTAL_GOALS	4球	4.80	2026-06-12 10:53:39.031
15218	111	TOTAL_GOALS	5球	8.10	2026-06-12 10:53:39.032
15219	111	TOTAL_GOALS	6球	12.00	2026-06-12 10:53:39.032
15220	111	TOTAL_GOALS	7+	18.00	2026-06-12 10:53:39.033
15221	111	CORRECT_SCORE	1:0	27.00	2026-06-12 10:53:39.033
15222	111	CORRECT_SCORE	2:0	95.00	2026-06-12 10:53:39.034
15223	111	CORRECT_SCORE	2:1	32.00	2026-06-12 10:53:39.035
15224	111	CORRECT_SCORE	3:0	350.00	2026-06-12 10:53:39.035
15225	111	CORRECT_SCORE	3:1	175.00	2026-06-12 10:53:39.036
15226	111	CORRECT_SCORE	3:2	150.00	2026-06-12 10:53:39.037
15227	111	CORRECT_SCORE	4:0	800.00	2026-06-12 10:53:39.037
15228	111	CORRECT_SCORE	4:1	600.00	2026-06-12 10:53:39.038
15229	111	CORRECT_SCORE	4:2	500.00	2026-06-12 10:53:39.038
15230	111	CORRECT_SCORE	5:0	800.00	2026-06-12 10:53:39.039
15231	111	CORRECT_SCORE	5:1	800.00	2026-06-12 10:53:39.039
15232	111	CORRECT_SCORE	5:2	800.00	2026-06-12 10:53:39.039
15234	111	CORRECT_SCORE	0:0	16.00	2026-06-12 10:53:39.04
15235	111	CORRECT_SCORE	1:1	10.00	2026-06-12 10:53:39.042
15236	111	CORRECT_SCORE	2:2	28.00	2026-06-12 10:53:39.043
15237	111	CORRECT_SCORE	3:3	125.00	2026-06-12 10:53:39.044
15239	111	CORRECT_SCORE	0:1	6.30	2026-06-12 10:53:39.044
15240	111	CORRECT_SCORE	0:2	4.40	2026-06-12 10:53:39.045
15241	111	CORRECT_SCORE	1:2	7.50	2026-06-12 10:53:39.045
15242	111	CORRECT_SCORE	0:3	6.10	2026-06-12 10:53:39.046
15243	111	CORRECT_SCORE	1:3	10.00	2026-06-12 10:53:39.046
15244	111	CORRECT_SCORE	2:3	35.00	2026-06-12 10:53:39.046
15245	111	CORRECT_SCORE	0:4	11.50	2026-06-12 10:53:39.047
15246	111	CORRECT_SCORE	1:4	20.00	2026-06-12 10:53:39.047
15247	111	CORRECT_SCORE	2:4	65.00	2026-06-12 10:53:39.048
15248	111	CORRECT_SCORE	0:5	22.00	2026-06-12 10:53:39.048
15249	111	CORRECT_SCORE	1:5	40.00	2026-06-12 10:53:39.051
15250	111	CORRECT_SCORE	2:5	110.00	2026-06-12 10:53:39.052
15233	111	CORRECT_SCORE	胜其它	500.00	2026-06-12 10:53:39.052
15238	111	CORRECT_SCORE	平其它	500.00	2026-06-12 10:53:39.053
15251	111	CORRECT_SCORE	负其它	19.00	2026-06-12 10:53:39.053
\.


--
-- Data for Name: tournaments; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.tournaments (id, name, "leagueId", season, "startDate", "endDate", status, "createdAt", "updatedAt") FROM stdin;
1	2026 FIFA World Cup	1	2026	2026-06-11 00:00:00	2026-07-19 00:00:00	ACTIVE	2026-06-02 09:29:48.296	2026-06-02 09:29:48.296
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.transactions (id, "userId", type, amount, "balanceAfter", "relatedBetId", "operatorId", remark, "createdAt") FROM stdin;
4	9	WIN	89.60	89.60	14	\N	中奖发放	2026-06-02 16:46:11.709
5	9	WIN	25.70	115.30	16	\N	中奖发放	2026-06-02 16:46:11.717
6	7	WIN	44.80	44.80	21	\N	中奖发放	2026-06-02 16:46:11.727
7	8	WIN	41.40	41.40	7	\N	中奖发放	2026-06-02 17:18:36.377
8	7	WIN	106.40	151.20	12	\N	中奖发放	2026-06-02 17:18:36.404
9	9	WIN	20.70	136.00	27	\N	中奖发放	2026-06-02 17:18:36.415
10	8	ADJUST	-41.40	0.00	7	\N	结算修正回退	2026-06-02 17:27:16.414
11	7	ADJUST	-106.40	44.80	12	\N	结算修正回退	2026-06-02 17:27:16.423
12	9	ADJUST	-20.70	115.30	27	\N	结算修正回退	2026-06-02 17:27:16.428
13	8	WIN	41.40	41.40	7	\N	中奖发放	2026-06-02 17:27:16.511
14	8	WIN	2000.00	2041.40	10	\N	中奖发放	2026-06-02 17:27:16.521
15	7	WIN	106.40	151.20	12	\N	中奖发放	2026-06-02 17:27:16.527
16	9	WIN	20.70	136.00	27	\N	中奖发放	2026-06-02 17:27:16.531
17	9	WIN	110.00	246.00	28	\N	中奖发放	2026-06-02 17:27:16.535
18	8	ADJUST	-41.40	2000.00	7	\N	结算修正回退	2026-06-02 17:43:35.099
19	8	ADJUST	-2000.00	0.00	10	\N	结算修正回退	2026-06-02 17:43:35.105
20	7	ADJUST	-106.40	44.80	12	\N	结算修正回退	2026-06-02 17:43:35.108
21	9	ADJUST	-20.70	225.30	27	\N	结算修正回退	2026-06-02 17:43:35.112
22	9	ADJUST	-110.00	115.30	28	\N	结算修正回退	2026-06-02 17:43:35.114
23	8	WIN	102.00	102.00	5	\N	中奖发放	2026-06-02 17:43:35.153
24	9	WIN	51.00	166.30	31	\N	中奖发放	2026-06-02 17:43:35.168
25	7	WIN	30.20	75.00	33	\N	中奖发放	2026-06-02 17:43:35.182
26	7	WIN	210.00	285.00	34	\N	中奖发放	2026-06-02 17:43:35.187
27	8	WIN	10.45	112.45	39	\N	中奖发放	2026-06-03 00:53:08.412
28	8	WIN	67.50	179.95	43	\N	中奖发放	2026-06-03 00:53:08.415
29	7	WIN	18.75	1018.75	57	\N	中奖发放	2026-06-12 10:56:22.768
30	8	WIN	23.75	1023.75	58	\N	中奖发放	2026-06-12 10:56:22.775
\.


--
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.user_stats (id, "userId", "totalBets", "totalWonBets", "totalBetAmount", "totalWinAmount", "netProfit", "updatedAt") FROM stdin;
1	1	0	0	0.00	0.00	0.00	2026-06-11 12:34:44.323
13	9	0	0	0.00	0.00	0.00	2026-06-11 12:34:44.323
14	10	0	0	0.00	0.00	0.00	2026-06-11 12:34:44.323
11	7	3	1	15.00	18.75	3.75	2026-06-12 10:56:22.777
12	8	1	1	5.00	23.75	18.75	2026-06-12 10:56:22.778
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.users (id, username, nickname, avatar, role, status, "createdAt", "updatedAt") FROM stdin;
1	admin	管理员	\N	ADMIN	ACTIVE	2026-06-02 05:25:03.556	2026-06-02 05:25:03.556
7	guoguo	锅锅	\N	PLAYER	ACTIVE	2026-06-02 15:58:04.613	2026-06-02 15:58:04.613
8	dashen	大神	\N	PLAYER	ACTIVE	2026-06-02 15:58:11.301	2026-06-02 15:58:11.301
9	fumei	福美	\N	PLAYER	ACTIVE	2026-06-02 15:58:28.312	2026-06-02 15:58:28.312
10	chenzong	陈总	\N	PLAYER	ACTIVE	2026-06-02 15:58:46.617	2026-06-02 15:58:54.838
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: hiqi
--

COPY public.wallets (id, "userId", balance, "updatedAt") FROM stdin;
1	1	1000.00	2026-06-11 12:34:44.325
10	10	1000.00	2026-06-11 12:34:44.325
9	9	1000.00	2026-06-11 12:34:44.325
7	7	1018.75	2026-06-12 10:56:22.767
8	8	1023.75	2026-06-12 10:56:22.775
\.


--
-- Name: bet_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.bet_items_id_seq', 62, true);


--
-- Name: bets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.bets_id_seq', 58, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.matches_id_seq', 241, true);


--
-- Name: odds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.odds_id_seq', 16319, true);


--
-- Name: tournaments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.tournaments_id_seq', 1, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.transactions_id_seq', 30, true);


--
-- Name: user_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.user_stats_id_seq', 62, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hiqi
--

SELECT pg_catalog.setval('public.wallets_id_seq', 10, true);


--
-- Name: bet_items bet_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bet_items
    ADD CONSTRAINT bet_items_pkey PRIMARY KEY (id);


--
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: odds odds_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.odds
    ADD CONSTRAINT odds_pkey PRIMARY KEY (id);


--
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: bet_items_betId_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "bet_items_betId_idx" ON public.bet_items USING btree ("betId");


--
-- Name: bet_items_matchId_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "bet_items_matchId_idx" ON public.bet_items USING btree ("matchId");


--
-- Name: bets_betUid_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX "bets_betUid_key" ON public.bets USING btree ("betUid");


--
-- Name: bets_status_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX bets_status_idx ON public.bets USING btree (status);


--
-- Name: bets_userId_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "bets_userId_idx" ON public.bets USING btree ("userId");


--
-- Name: matches_apiMatchId_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX "matches_apiMatchId_key" ON public.matches USING btree ("apiMatchId");


--
-- Name: matches_kickoffTime_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "matches_kickoffTime_idx" ON public.matches USING btree ("kickoffTime");


--
-- Name: matches_status_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX matches_status_idx ON public.matches USING btree (status);


--
-- Name: matches_tournamentId_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "matches_tournamentId_idx" ON public.matches USING btree ("tournamentId");


--
-- Name: odds_matchId_betType_optionKey_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX "odds_matchId_betType_optionKey_key" ON public.odds USING btree ("matchId", "betType", "optionKey");


--
-- Name: transactions_createdAt_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "transactions_createdAt_idx" ON public.transactions USING btree ("createdAt");


--
-- Name: transactions_userId_idx; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE INDEX "transactions_userId_idx" ON public.transactions USING btree ("userId");


--
-- Name: user_stats_userId_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX "user_stats_userId_key" ON public.user_stats USING btree ("userId");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: wallets_userId_key; Type: INDEX; Schema: public; Owner: hiqi
--

CREATE UNIQUE INDEX "wallets_userId_key" ON public.wallets USING btree ("userId");


--
-- Name: bet_items bet_items_betId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bet_items
    ADD CONSTRAINT "bet_items_betId_fkey" FOREIGN KEY ("betId") REFERENCES public.bets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bet_items bet_items_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bet_items
    ADD CONSTRAINT "bet_items_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bets bets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: matches matches_tournamentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES public.tournaments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: odds odds_matchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.odds
    ADD CONSTRAINT "odds_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_operatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_stats user_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wallets wallets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hiqi
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LWWj2Pebhsd0v1ZnmBzZuPWnSscuVuOmxEXRPd8OrvYV8QImZRPa18MUBYxgZeN

