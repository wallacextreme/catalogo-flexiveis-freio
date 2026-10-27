import json
import re

# Load raw master seed
with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Loaded {len(products)} products.")

def decode_e_corruption(s: str) -> str:
    if not s:
        return s
    # Check if s matches E-corruption pattern like ECEHEREYESELEEERE
    # All even indices (0, 2, 4...) are 'E'
    if len(s) >= 3 and s.startswith('E') and s.endswith('E'):
        if all(s[i] == 'E' for i in range(0, len(s), 2)):
            return ''.join(s[i] for i in range(1, len(s), 2))
    return s

EXACT_MAKE_MAP = {
    "ECEHEREYESELEEERE": "CHRYSLER",
    "EFEIEAETE": "FIAT",
    "EFEOEREDE": "FORD",
    "ECEHEEEVEREOELEEETE": "CHEVROLET",
    "EGEEENEEEREAELE EMEOETEOERESE": "CHEVROLET",
    "GM": "CHEVROLET",
    "EIEVEEECEOE": "IVECO",
    "EMEEERECEEEDEEESE-EBEEENEZE": "MERCEDES-BENZ",
    "MERCEDES": "MERCEDES-BENZ",
    "ECEIETEREOEEENE": "CITROËN",
    "CITROEN": "CITROËN",
    "EHEOENEDEAE": "HONDA",
    "EKEIEAE": "KIA",
    "EPEEEUEGEEEOETE": "PEUGEOT",
    "EREEENEAEUELETE": "RENAULT",
    "ETEOEYEOETEAE": "TOYOTA",
    "EVEOELEKESEWEAEGEEENE": "VOLKSWAGEN",
    "VW": "VOLKSWAGEN",
    "FIAI": "FIAT",
    "FORO": "FORD",
    "MITSIBISHI": "MITSUBISHI",
    "REUULT": "RENAULT"
}

def clean_make(m: str) -> str:
    if not m:
        return "GERAL"
    m_up = m.strip().upper()
    if m_up in EXACT_MAKE_MAP:
        return EXACT_MAKE_MAP[m_up]
    decoded = decode_e_corruption(m_up)
    if decoded in EXACT_MAKE_MAP:
        return EXACT_MAKE_MAP[decoded]
    if decoded in ["CHRYSLER", "FIAT", "FORD", "CHEVROLET", "IVECO", "MERCEDES-BENZ", "CITROËN", "HONDA", "KIA", "PEUGEOT", "RENAULT", "TOYOTA", "VOLKSWAGEN", "SCANIA", "VOLVO"]:
        return decoded
    if "MERCEDES" in m_up:
        return "MERCEDES-BENZ"
    if "CITRO" in m_up:
        return "CITROËN"
    if "E.E.E.E" in m_up or "E-E" in m_up:
        return "FIAT"
    return m.strip()

# Comprehensive official Norflex Index Map (from Pages 2-22 of official Norflex PDF)
NORFLEX_OFFICIAL_MAP = {
    # 2000 Series (Fiat / Iveco)
    "2001": ("FIAT", "147 / Panorama / Oggi / City / Fiorino", "01/76 - 12/88", "DIANTEIRO", 304, ["5966930-1"]),
    "2002": ("FIAT", "147 / Panorama / Fiorino", "01/76 - 12/88", "TRASEIRO", 257, ["5930453-1"]),
    "2003": ("FIAT", "Elba / Fiorino / Uno", "01/84 - 12/92", "DIANTEIRO", 380, ["5954603-1"]),
    "2004": ("FIAT", "Fiorino", "01/85 - 12/92", "TRASEIRO", 275, ["7573858"]),
    "2005": ("FIAT", "Tempra / Tipo", "01/92 - 12/98", "TRASEIRO", 430, ["706859"]),
    "2006": ("FIAT", "Tempra", "01/92 - 12/98", "DIANTEIRO", 445, ["1130632"]),
    "2007": ("FIAT", "Palio / Siena / Strada", "01/96 - ...", "TRASEIRO", 220, ["46456877"]),
    "2008": ("FIAT", "Palio / Siena / Strada", "01/96 - ...", "DIANTEIRO", 465, ["46448474-1"]),
    "2013": ("FIAT", "Tipo", "01/93 - 12/97", "DIANTEIRO", 410, ["8208102"]),
    "2014": ("FIAT", "Uno SX / Mille", "01/90 - ...", "DIANTEIRO", 400, ["5995581"]),
    "2015": ("FIAT", "Uno / CS / Prêmio / Elba", "01/85 - 12/95", "DIANTEIRO", 400, ["7725169"]),
    "2024": ("IVECO", "Daily Turbo 35.10", "01/97 - ...", "TRASEIRO", 300, ["93822394"]),
    "2025": ("IVECO", "Daily Turbo 35.10", "01/97 - ...", "DIANTEIRO", 530, ["91817105"]),
    "2028": ("FIAT", "Brava / Marea", "01/99 - 12/03", "DIANTEIRO", 425, ["46441569"]),
    "2035": ("FIAT", "Tempra 16V / Punto", "01/95 - ...", "TRASEIRO", 525, ["7771239"]),
    "2036": ("FIAT", "Palio Weekend", "01/97 - ...", "TRASEIRO", 240, ["82442878"]),
    "2108": ("FIAT", "Ducato", "01/98 - 12/05", "DIANTEIRO", 490, ["46786431"]),
    "2109": ("FIAT", "Ducato", "01/98 - 12/05", "TRASEIRO", 380, ["46786432"]),
    "2110": ("FIAT", "Palio Weekend", "01/97 - ...", "TRASEIRO", 250, ["82442878"]),
    "2112": ("FIAT", "Strada", "01/09 - 12/15", "TRASEIRO", 400, ["7758294"]),
    "2113": ("FIAT", "Idea / Idea Adventure / Strada", "01/06 - 12/15", "DIANTEIRO", 513, ["51739692"]),
    "2114": ("FIAT", "Punto", "01/08 - 12/15", "DIANTEIRO", 445, ["51783307"]),
    "2116": ("FIAT", "Stilo", "01/02 - 12/12", "DIANTEIRO", 434, ["46.554.126"]),
    "2117": ("FIAT", "Stilo", "01/02 - 12/12", "DIANTEIRO", 434, ["46554126"]),
    "2118": ("FIAT", "Stilo", "01/02 - 12/12", "TRASEIRO", 240, ["46808796"]),
    "2121": ("FIAT", "Palio Adventure / Palio Weekend", "01/97 - 12/14", "TRASEIRO", 400, ["46556013"]),
    "2122": ("FIAT", "Ducato Multijet", "01/06 - 12/12", "DIANTEIRO", 490, ["46786435"]),
    "2123": ("FIAT", "Doblò", "01/02 - 12/15", "DIANTEIRO", 495, ["46738613"]),
    "2126": ("FIAT", "Palio Novo / Grand Siena", "01/10 - 12/15", "DIANTEIRO", 530, ["51833620"]),
    "2130": ("FIAT", "Doblò Adventure / Locker", "01/04 - 12/15", "DIANTEIRO", 495, ["51717163"]),
    "2131": ("FIAT", "Doblò Adventure / Locker", "01/04 - 12/15", "DIANTEIRO", 515, ["51717163"]),

    # 3000 Series (Ford)
    "3036": ("FIAT", "Siena / Palio / Strada", "01/96 - ...", "DIANTEIRO", 465, ["46448474"]),
    "3042": ("FORD", "Fiesta", "01/96 - 12/02", "TRASEIRO", 350, ["96FB2282AB"]),
    "30155": ("FORD", "Cargo / F-1000", "01/85 - 12/98", "TRASEIRO", 350, ["T71611775"]),
    "3089": ("FORD", "Corcel / Belina / Del Rey / Pampa", "01/78 - 12/97", "TRASEIRO", 400, ["78MU2282A"]),
    "3111": ("FORD", "Focus", "01/00 - 12/08", "TRASEIRO", 280, ["3M512282JWFC"]),
    "3119": ("FORD", "Ecosport / Fiesta", "01/03 - 12/12", "DIANTEIRO", 480, ["2N152078BC"]),

    # 4000 Series (Chevrolet / GM / Chrysler / Honda)
    "1005": ("CHRYSLER", "Simca / Regente / GTX", "01/69 - 12/70", "DIANTEIRO", 360, ["1922137"]),
    "4001": ("CHEVROLET", "C-60 / C-65 / D-60 Série 6000", "01/64 - 12/84", "DIANTEIRO", 500, ["7324545"]),
    "4009": ("CHEVROLET", "Chevette", "01/79 - 12/93", "DIANTEIRO", 380, ["94502515"]),
    "4013": ("CHEVROLET", "Monza", "01/82 - 12/96", "DIANTEIRO", 360, ["90168393"]),
    "4020": ("CHEVROLET", "Chevette", "01/73 - 12/93", "DIANTEIRO", 340, ["94651667"]),
    "4021": ("CHEVROLET", "Chevette / Chevy 500", "01/73 - 12/93", "TRASEIRO", 290, ["94651668"]),
    "4036": ("CHEVROLET", "Chevette", "01/73 - 12/93", "TRASEIRO", 365, ["8982399"]),
    "4078": ("CHEVROLET", "Chevette (Freio a Tambor)", "01/73 - 12/93", "DIANTEIRO", 340, ["94651667"]),
    "4084": ("CHEVROLET", "Chevette (Intermediário)", "01/73 - 12/93", "CENTRAL", 300, ["94632258"]),
    "4093": ("CHEVROLET", "D-20 / D-40 (Rosca 12x1)", "01/85 - 12/96", "TRASEIRO", 450, ["94620079"]),
    "4094": ("CHEVROLET", "Opala / Caravan (Cilindro Mestre)", "01/69 - 12/92", "CENTRAL", 224, ["9298224"]),
    "4104A": ("CHEVROLET", "Chevette (Rosca Fêmea)", "01/73 - 12/93", "DIANTEIRO", 340, ["94651667"]),
    "4109": ("CHEVROLET", "D-20 / D-40", "01/85 - 12/96", "DIANTEIRO", 480, ["94632258"]),
    "4207": ("HONDA", "Civic", "01/91 - 12/95", "DIANTEIRO", 464, ["01464SR3000"]),
    "4208": ("HONDA", "Fit", "01/04 - 12/08", "DIANTEIRO", 490, ["01468SAAOOD"]),
    "4210": ("HONDA", "Fit (Com e Sem ABS)", "01/04 - 12/08", "DIANTEIRO", 490, ["01454-SA0-M00"]),
    "4212": ("HONDA", "City / Fit", "01/09 - 12/15", "TRASEIRO", 310, ["01468TF0G00"]),
    "4804": ("HYUNDAI", "HR / H100 (Embreagem)", "01/00 - ...", "CENTRAL", 340, ["58734010"]),

    # 5000 Series (Mercedes-Benz)
    "5196": ("MERCEDES-BENZ", "Caminhões L / LK 1113 / 1313", "01/70 - 12/88", "DIANTEIRO", 280, ["0024283835"]),
    "5198": ("MERCEDES-BENZ", "L 1620 / 1622 (Embreagem)", "01/96 - ...", "CENTRAL", 480, ["6952950135"]),

    # 6000 Series (Toyota)
    "6022": ("TOYOTA", "Corolla", "01/03 - 12/08", "TRASEIRO", 270, ["9094702D15"]),

    # 7000 Series (Volkswagen)
    "7031": ("VOLKSWAGEN", "Golf", "01/94 - 12/98", "TRASEIRO", 170, ["6N0611775A"]),
    "7049": ("VOLKSWAGEN", "Bora / New Beetle / Golf IV", "01/99 - 12/12", "DIANTEIRO", 435, ["1J0611701"]),
    "7061": ("VOLKSWAGEN", "Up!", "01/14 - ...", "TRASEIRO", 560, ["1S0611701"]),

    # 8000 Series (Renault / Mitsubishi / Kia / Asia)
    "8215": ("RENAULT", "R19", "01/92 - 12/98", "DIANTEIRO", 290, ["7701349305"]),
    "8226": ("RENAULT", "Laguna / Laguna Weekend", "01/94 - 12/01", "DIANTEIRO", 500, ["7700822600"]),
    "8227": ("RENAULT", "Laguna / Laguna Weekend", "01/94 - 12/01", "TRASEIRO", 310, ["7700822700"]),
    "8234": ("RENAULT", "Master", "01/02 - ...", "TRASEIRO", 555, ["8200057038"]),
    "8240": ("RENAULT", "Duster / Oroch / Sandero", "01/11 - ...", "DIANTEIRO", 440, ["462108452R"]),
    "8301": ("ASIA / KIA", "Towner", "01/93 - 12/98", "DIANTEIRO", 380, ["AA10043810"]),
    "8418": ("KIA", "Sportage", "01/95 - 12/04", "DIANTEIRO", 300, ["0K01145390C"]),
    "8501": ("MITSUBISHI", "L200 / L200 Sport", "01/94 - 12/03", "TRASEIRO", 355, ["MR129595"]),
    "8502": ("MITSUBISHI", "L200 / L200 Sport", "01/94 - 12/03", "TRASEIRO", 330, ["MR129596"]),
    "8506": ("MITSUBISHI", "L200 Triton", "01/07 - ...", "TRASEIRO", 380, ["4650A227"]),
    "8510": ("MITSUBISHI", "L200 Sport", "01/03 - ...", "DIANTEIRO", 380, ["MR238164"]),
    "8511": ("MITSUBISHI", "Pajero / L200", "01/98 - ...", "DIANTEIRO", 360, ["MR307104"]),

    # 9000 & Other (Chery / Scania / Special)
    "9000": ("CHERY", "Face / Cielo / QQ", "01/09 - ...", "DIANTEIRO", 480, ["A11-3506010"]),
    "3820W": ("SCANIA", "Caminhões Série 4 (P/G/R)", "01/98 - ...", "CENTRAL", 480, ["1371201"]),
    "4200W": ("VOLVO", "Caminhões FH / FM", "01/98 - ...", "CENTRAL", 450, ["141124"]),
    "DH2264": ("FIAT", "Tempra 2.0 (2000cc)", "01/92 - 12/98", "DIANTEIRO", 445, ["15283"]),
    "DH3051": ("FORD", "Caminhões Série F", "01/85 - ...", "DIANTEIRO", 1435, ["2SB143570"]),
    "DH55133": ("FORD", "Fiesta Amazon", "01/02 - 12/14", "DIANTEIRO", 480, ["2SE53A71381"]),
    "DH76112": ("FORD", "Ecosport (Pressão c/ Sensor)", "01/03 - 12/12", "DIANTEIRO", 950, ["5N15-3524-AA"]),
    "DH35527": ("VOLKSWAGEN", "14.210 / 16.210 Ônibus", "01/90 - ...", "CENTRAL", 1421, ["2RD422893"]),
    "DH35651": ("VOLKSWAGEN", "11.200 / 14.140 / 12.140 / 11.130", "01/88 - ...", "CENTRAL", 1120, ["2RD422895"]),
}

print("Executing thorough master clean...")
cleaned_count = 0

for p in products:
    sku = p['sku']
    brand = p['brand']

    # 1. Clean product-level makes
    new_makes = []
    for m in p.get('makes', []):
        cm = clean_make(m)
        if cm and cm != "GERAL" and cm not in new_makes:
            new_makes.append(cm)
    p['makes'] = new_makes

    # 2. Check if product is in curated official Norflex map
    if brand == 'Norflex' and sku in NORFLEX_OFFICIAL_MAP:
        mk, model, years, pos, length, oems = NORFLEX_OFFICIAL_MAP[sku]
        p['makes'] = [mk]
        p['specs']['position'] = pos
        p['specs']['lengthMm'] = length
        p['lengths'] = [length]
        p['positions'] = [pos]
        for o in oems:
            if o not in p['oemEquivalents']:
                p['oemEquivalents'].append(o)
        p['applications'] = [{
            "make": mk,
            "models": model,
            "years": years,
            "position": pos,
            "lengthMm": length
        }]
        p['name'] = f"Flexível de Freio {mk} {model} {pos} {length}mm"
        cleaned_count += 1
        continue

    # 3. Clean TRW 147 applications
    if sku in ['RPFX00050', 'RPFX00060']:
        p['makes'] = ['FIAT']
        pos = 'DIANTEIRO' if sku == 'RPFX00050' else 'TRASEIRO'
        length = 304 if sku == 'RPFX00050' else 257
        p['applications'] = [
            {"make": "FIAT", "models": "147", "years": "01/76 - 12/88", "position": pos, "lengthMm": length},
            {"make": "FIAT", "models": "Fiorino", "years": "01/76 - 12/88", "position": pos, "lengthMm": length},
            {"make": "FIAT", "models": "Oggi", "years": "01/83 - 12/85", "position": pos, "lengthMm": length},
            {"make": "FIAT", "models": "Panorama", "years": "01/80 - 12/86", "position": pos, "lengthMm": length},
        ]
        p['specs']['position'] = pos
        p['specs']['lengthMm'] = length
        p['positions'] = [pos]
        p['lengths'] = [length]
        p['name'] = f"Flexível de Freio TRW FIAT 147 / Fiorino / Oggi / Panorama {pos} {length}mm"
        cleaned_count += 1
        continue

    # 4. General application cleaning
    cleaned_apps = []
    for app in p.get('applications', []):
        raw_m = app.get('models', '')
        mk = clean_make(app.get('make', ''))
        app['make'] = mk

        # A. Strip corrupt prefixes
        m = raw_m
        for bad_pfx in [
            "ECEHEREYESELEEERE", "EFEIEAETE", "EFEOEREDE", "ECEHEEEVEREOELEEETE",
            "EGEEENEEEREAELE EMEOETEOERESE", "EIEVEEECEOE", "EMEEERECEEEDEEESE-EBEEENEZE",
            "ECEIETEREOEEENE", "EHEOENEDEAE", "EKEIEAE", "EPEEEUEGEEEOETE",
            "EREEENEAEUELETE", "ETEOEYEOETEAE", "EVEOELEKESEWEAEGEEENE",
            "E.E.E.E E-E E.E.E.E", "E.E.E.E", "E-E", "... - ...", "Todos ... - ..."
        ]:
            if bad_pfx in m:
                m = m.replace(bad_pfx, "").strip()

        # B. Extract OEM candidates (numeric >= 5 digits, or patterns with dots/commas/dashes, or alphanumeric OEM)
        # e.g. 46554,126, 94502515, 3M512282JWFC, 01468TFOGOO, 462108452R, 01454SAOMOD, 2SE53A71381
        oem_patterns = [
            r'\b[0-9A-Z]{2,4}[0-9]{4,}[0-9A-Z]{1,4}\b', # alphanumeric OEM like 3M512282JWFC, 2SE53A71381, 01468TFOGOO
            r'\b\d{1,5}[\.,]\d{2,4}(?:[\.,]\d{1,4})*(?:-\d)?\b', # dotted/comma like 46554,126 or 5.966.930-1
            r'\b\d{6,10}(?:-\d)?\b', # large pure numbers
        ]
        for pat in oem_patterns:
            matches = re.findall(pat, m)
            for cand in matches:
                # verify not a valid vehicle model like 147, 608, 709, 1113, 1313, 205, 206, 504
                if re.match(r'^(?:147|608|709|1113|1313|1513|1620|1622|205|206|207|208|306|307|308|405|406|407|408|504|505)$', cand):
                    continue
                clean_oem_str = cand.replace(',', '.').strip()
                if clean_oem_str not in p['oemEquivalents'] and len(re.sub(r'\D', '', clean_oem_str)) >= 4:
                    p['oemEquivalents'].append(clean_oem_str)
                m = m.replace(cand, "")

        # C. Extract and remove position & length tokens
        pos_len_pat = r'(?:DIANT(?:EIR[O0])?|UANTER[O0]|MANTEIR[O0]|CIAMTE[I1]R[O0]|CIAVTER[O0]|ffANTER[O0]|DIANTER[O0]|TRAS(?:EIR[O0])?|TRASER[O0]|TUSEIRO|TBASUO|TRAWRO)[0-9\s]*[A-Z0-9]*|\b\d{3,4}\s*(?:MM|MN|UM)\b|\b\d{3,4}\"'
        pos_lens = re.findall(pos_len_pat, m, re.IGNORECASE)
        for pl in pos_lens:
            d_match = re.findall(r'\d{3,4}', pl)
            if d_match:
                val = int(d_match[-1])
                if 150 <= val <= 2500:
                    p['specs']['lengthMm'] = val
                    p['lengths'] = [val]
            if any(x in pl.upper() for x in ['DIANT', 'MANTEIR', 'UANTER', 'CIAMTE', 'CIAVTER', 'ffANTER']):
                p['specs']['position'] = 'DIANTEIRO'
                p['positions'] = ['DIANTEIRO']
            elif any(x in pl.upper() for x in ['TRAS', 'TRASER', 'TUSEIRO', 'TBASUO', 'TRAWRO']):
                p['specs']['position'] = 'TRASEIRO'
                p['positions'] = ['TRASEIRO']
            m = m.replace(pl, "")

        # D. Split parts, remove duplicate make names and junk
        raw_parts = [p.strip() for p in re.split(r'//|/|,', m) if p.strip()]
        clean_parts = []
        filter_words = {
            'FIAT', 'FORD', 'CHEVROLET', 'GM', 'VW', 'VOLKSWAGEN', 'GERAL', 'CARRO',
            'CHRYSLER', 'MERCEDES', 'MERCEDES-BENZ', 'RENAULT', 'TOYOTA', 'HONDA',
            'MITSUBISHI', 'IVECO', 'PEUGEOT', 'CITROEN', 'CITROËN', 'KIA', 'ASIA',
            'FLEX', 'FLEXIVEL', 'DIANTEIRO', 'TRASEIRO', 'CENTRAL', 'INTERMEDIARIO'
        }
        for part in raw_parts:
            pu = part.upper().strip()
            # Clean OCR artifacts from part
            clean_part = re.sub(r'[\'\"%$\?\(\)\[\]_\\]', '', part).strip()
            if not clean_part or clean_part.upper() in filter_words or clean_part.upper() == mk.upper():
                continue
            # Keep vehicle numbers like 147, 11000 (F 11000)
            if re.match(r'^\d{5,}$', clean_part) and not any(k in pu for k in ['11000', '12000', '14000', '22000']):
                continue
            if len(clean_part) <= 2 and clean_part not in ['SX', 'CS', 'GL', 'GT', 'LX', 'SL', 'CL', 'Up']:
                continue
            clean_parts.append(clean_part)

        cleaned_model_str = " / ".join(clean_parts).strip(' /-,')

        # E. Specific model spelling corrections
        cleaned_model_str = re.sub(r'\bTEMPWTIPO\b', 'Tipo / Tempra', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bFCRDRANGER\b', 'Ranger', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bUNOSX/WI\b', 'Uno SX / Mille', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bSW/WEEKEMJ\b', 'Palio Weekend', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bHONDAFITTODOS.*?\b', 'Fit', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bVOKSWI\[?H?\b', '', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bvwup\b', 'Up!', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bvwm\b', '', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bCOLF\b', 'Golf', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bRENAIRT\b', '', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bLENA\.\b', '', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bGMCHEVETTE\b', 'Chevette', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bCHEVETTE\d+.*?\b', 'Chevette', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bCHEVY\b', 'Chevy 500', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bSIMCVREGENTE\b', 'Simca / Regente', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bGWO\b', 'GTX', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bF\s*11000\b', 'F-11000', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bF\s*12000\b', 'F-12000', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bF\s*14000\b', 'F-14000', cleaned_model_str, flags=re.IGNORECASE)
        cleaned_model_str = re.sub(r'\bF\s*22000\b', 'F-22000', cleaned_model_str, flags=re.IGNORECASE)

        cleaned_model_str = re.sub(r'\s+/\s+', ' / ', cleaned_model_str).strip(' /-,')

        if not cleaned_model_str:
            if mk and mk != "GERAL":
                cleaned_model_str = f"{mk} (Aplicação Técnica)"
            else:
                cleaned_model_str = "Aplicação Técnica Automotiva"

        # Clean position if it contains OEM or length
        apos = app.get('position', '')
        if apos:
            if apos.startswith('D') and len(apos) == 4 and apos[1:].isdigit():
                p['specs']['lengthMm'] = int(apos[1:])
                p['lengths'] = [int(apos[1:])]
                app['position'] = 'DIANTEIRO'
                p['specs']['position'] = 'DIANTEIRO'
            elif re.search(r'\b\d{3,4}\s*MM\b', apos, re.IGNORECASE):
                d = re.findall(r'\d{3,4}', apos)
                if d:
                    p['specs']['lengthMm'] = int(d[-1])
                    p['lengths'] = [int(d[-1])]
                app['position'] = 'DIANTEIRO / TRASEIRO'
            elif any(c.isdigit() for c in apos) and len(apos) >= 4:
                # OEM leaked into position
                if apos not in p['oemEquivalents']:
                    p['oemEquivalents'].append(apos)
                app['position'] = 'DIANTEIRO / TRASEIRO'
            elif apos in ['D', 'DD', 'DE']:
                app['position'] = 'DIANTEIRO'
            elif apos in ['T', 'TD', 'TE']:
                app['position'] = 'TRASEIRO'
            elif apos == 'EMB':
                app['position'] = 'EMBREAGEM'

        app['models'] = cleaned_model_str
        cleaned_apps.append(app)

    p['applications'] = cleaned_apps

    # Sanitize product specs position
    sp_pos = p['specs'].get('position', '')
    if sp_pos:
        if sp_pos.startswith('D') and len(sp_pos) == 4 and sp_pos[1:].isdigit():
            p['specs']['lengthMm'] = int(sp_pos[1:])
            p['lengths'] = [int(sp_pos[1:])]
            p['specs']['position'] = 'DIANTEIRO'
        elif re.search(r'\b\d{3,4}\s*MM\b', sp_pos, re.IGNORECASE):
            d = re.findall(r'\d{3,4}', sp_pos)
            if d:
                p['specs']['lengthMm'] = int(d[-1])
                p['lengths'] = [int(d[-1])]
            p['specs']['position'] = 'DIANTEIRO / TRASEIRO'
        elif any(c.isdigit() for c in sp_pos) and len(sp_pos) >= 4:
            if sp_pos not in p['oemEquivalents']:
                p['oemEquivalents'].append(sp_pos)
            p['specs']['position'] = 'DIANTEIRO / TRASEIRO'
        elif sp_pos in ['D', 'DD', 'DE']:
            p['specs']['position'] = 'DIANTEIRO'
        elif sp_pos in ['T', 'TD', 'TE']:
            p['specs']['position'] = 'TRASEIRO'
        elif sp_pos == 'EMB':
            p['specs']['position'] = 'EMBREAGEM'

    # 5. Clean product name
    primary_mk = p['makes'][0] if p['makes'] else "Automotivo"
    first_app = p['applications'][0] if p['applications'] else {}
    primary_model = first_app.get('models', '')
    if 'Aplicação Técnica' in primary_model:
        primary_model = ''
    primary_pos = p['specs'].get('position') or 'Dianteiro/Traseiro'
    primary_len = p['specs'].get('lengthMm') or ''

    len_str = f"{primary_len}mm" if primary_len else ""
    model_short = primary_model.split('/')[0].strip() if primary_model else ""
    
    clean_name = f"Flexível de Freio {brand} {primary_mk} {model_short} {primary_pos} {len_str}".strip()
    clean_name = re.sub(r'\s+', ' ', clean_name)
    p['name'] = clean_name

# Write cleaned catalog-master-seed.json
with open('src/data/catalog-master-seed.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("Catalog master seed thoroughly cleaned and saved!")
