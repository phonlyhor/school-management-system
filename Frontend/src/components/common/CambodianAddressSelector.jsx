import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CAMBODIA_LOCATIONS } from '../../data/cambodianLocations';

const DEFAULT_VILLAGE_SUGGESTIONS = [
    'ភូមិ១', 'ភូមិ២', 'ភូមិ៣', 'ភូមិ៤', 'ភូមិ៥', 'ភូមិ៦', 'ភូមិ៧', 'ភូមិ៨', 'ភូមិ៩', 'ភូមិ១០',
    'ភូមិថ្មី', 'ភូមិចាស់', 'ភូមិកណ្តាល', 'ភូមិត្រពាំង', 'ភូមិព្រៃ', 'ភូមិកោះ', 'ភូមិផ្សារ',
    'ភូមិវត្ត', 'ភូមិស្វាយ', 'ភូមិដើម'
];

const CambodianAddressSelector = ({ value = '', onChange, onAddressChange, required = false, label }) => {
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);

    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [commune, setCommune] = useState('');
    const [village, setVillage] = useState('');
    const [streetDetail, setStreetDetail] = useState('');
    const [isManualEdit, setIsManualEdit] = useState(false);

    // Fetch dynamic location data from API
    useEffect(() => {
        let isMounted = true;
        const fetchLocations = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                const response = await axios.get(`${baseUrl}/locations/cambodia`);
                if (isMounted && response.data?.locations?.length > 0) {
                    setLocations(response.data.locations);
                } else if (isMounted) {
                    setLocations(CAMBODIA_LOCATIONS);
                }
            } catch (err) {
                console.warn("Using fallback location data due to network:", err);
                if (isMounted) setLocations(CAMBODIA_LOCATIONS);
            } finally {
                if (isMounted) setLoadingLocations(false);
            }
        };

        fetchLocations();
        return () => { isMounted = false; };
    }, []);

    // Sync state when external value changes or locations load
    useEffect(() => {
        if (!value) {
            setProvince('');
            setDistrict('');
            setCommune('');
            setVillage('');
            setStreetDetail('');
            return;
        }

        if (locations.length === 0) return;

        const parts = value.split(',').map(s => s.trim());
        let foundProvince = '';
        let foundDistrict = '';
        let foundCommune = '';

        for (const loc of locations) {
            if (parts.some(p => p === loc.province)) {
                foundProvince = loc.province;
                for (const dist of loc.districts || []) {
                    if (parts.some(p => p === dist.name)) {
                        foundDistrict = dist.name;
                        for (const com of dist.communes || []) {
                            const communeName = typeof com === 'string' ? com : com.name;
                            if (parts.some(p => p === communeName)) {
                                foundCommune = communeName;
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        if (foundProvince) {
            setProvince(foundProvince);
            setDistrict(foundDistrict);
            setCommune(foundCommune);
            const known = [foundProvince, foundDistrict, foundCommune].filter(Boolean);
            const remainingParts = parts.filter(p => !known.includes(p));
            if (remainingParts.length > 0) {
                setVillage(remainingParts[0]);
                setStreetDetail(remainingParts.slice(1).join(', '));
            }
        } else {
            setVillage(value);
        }
    }, [value, locations]);

    const updateFullAddress = (p, d, c, v, s) => {
        const full = [s, v, c, d, p].map(str => (str || '').trim()).filter(Boolean).join(', ');
        if (onChange) onChange(full);
        if (onAddressChange) {
            onAddressChange({
                province: p || '',
                district: d || '',
                commune: c || '',
                village: v || '',
                address: full
            });
        }
    };

    const handleProvinceChange = (e) => {
        const p = e.target.value;
        setProvince(p);
        setDistrict('');
        setCommune('');
        setVillage('');
        updateFullAddress(p, '', '', '', streetDetail);
    };

    const handleDistrictChange = (e) => {
        const d = e.target.value;
        setDistrict(d);
        setCommune('');
        setVillage('');
        updateFullAddress(province, d, '', '', streetDetail);
    };

    const handleCommuneChange = (e) => {
        const c = e.target.value;
        setCommune(c);
        setVillage('');
        updateFullAddress(province, district, c, '', streetDetail);
    };

    const handleVillageChange = (e) => {
        const v = e.target.value;
        setVillage(v);
        updateFullAddress(province, district, commune, v, streetDetail);
    };

    const handleStreetDetailChange = (e) => {
        const s = e.target.value;
        setStreetDetail(s);
        if (isManualEdit) {
            onChange(s);
        } else {
            updateFullAddress(province, district, commune, village, s);
        }
    };

    // Find districts for selected province
    const activeProvinceData = locations.find(l => l.province === province);
    const districtList = activeProvinceData ? (activeProvinceData.districts || []) : [];

    // Find communes for selected district
    const activeDistrictData = districtList.find(d => d.name === district);
    const communeList = activeDistrictData ? (activeDistrictData.communes || []) : [];

    // Find village list for selected commune if available, or fallback to DEFAULT_VILLAGE_SUGGESTIONS
    let villageList = DEFAULT_VILLAGE_SUGGESTIONS;
    if (activeDistrictData && commune) {
        const activeCommuneObj = (activeDistrictData.communes || []).find(c => (typeof c === 'string' ? c : c.name) === commune);
        if (activeCommuneObj && typeof activeCommuneObj === 'object' && Array.isArray(activeCommuneObj.villages)) {
            villageList = activeCommuneObj.villages;
        }
    }

    return (
        <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🗺️ {label || 'អាសយដ្ឋាន / ទីតាំងរស់នៅ (Address / Location)'} {required && <span style={{ color: '#ef4444' }}>*</span>}
                    {loadingLocations && <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 'normal' }}>(⚡ កំពុងទាញយកទិន្នន័យទីតាំង...)</span>}
                </label>
                <button
                    type="button"
                    onClick={() => setIsManualEdit(!isManualEdit)}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isManualEdit ? '⚡ ប្រើជម្រើសជ្រើសរើស (Select Dropdowns)' : '✏️ វាយបញ្ចូលដោយផ្ទាល់ (Manual Input)'}
                </button>
            </div>

            {!isManualEdit ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.65rem' }}>
                        {/* Dropdown 1: Province / Capital */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                                🏙️ រាជធានី / ខេត្ត
                            </label>
                            <select
                                value={province}
                                onChange={handleProvinceChange}
                                disabled={loadingLocations}
                                required={required && !value}
                                style={{ width: '100%', height: '40px', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.83rem', color: '#0f172a' }}
                            >
                                <option value="">-- {loadingLocations ? 'កំពុងទាញ...' : 'ជ្រើសរើសខេត្ត'} --</option>
                                {locations.map((loc) => (
                                    <option key={loc.province} value={loc.province}>
                                        {loc.province}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown 2: District / Khan */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                                🏛️ ក្រុង / ស្រុក / ខណ្ឌ
                            </label>
                            <select
                                value={district}
                                onChange={handleDistrictChange}
                                disabled={!province || loadingLocations}
                                style={{ width: '100%', height: '40px', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.83rem', color: '#0f172a', backgroundColor: (!province || loadingLocations) ? '#f1f5f9' : '#ffffff' }}
                            >
                                <option value="">-- {province ? 'ជ្រើសរើសស្រុក' : 'ជ្រើសខេត្តមុន'} --</option>
                                {districtList.map((d) => (
                                    <option key={d.name} value={d.name}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown 3: Commune / Sangkat */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                                🏘️ ឃុំ / សង្កាត់
                            </label>
                            <select
                                value={commune}
                                onChange={handleCommuneChange}
                                disabled={!district || loadingLocations}
                                style={{ width: '100%', height: '40px', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.83rem', color: '#0f172a', backgroundColor: (!district || loadingLocations) ? '#f1f5f9' : '#ffffff' }}
                            >
                                <option value="">-- {district ? 'ជ្រើសរើសឃុំ' : 'ជ្រើសស្រុកមុន'} --</option>
                                {communeList.map((c) => {
                                    const cName = typeof c === 'string' ? c : c.name;
                                    return (
                                        <option key={cName} value={cName}>
                                            {cName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Dropdown 4: Village / Phum */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                                🏡 ភូមិ (Village)
                            </label>
                            <select
                                value={villageList.includes(village) ? village : (village ? 'CUSTOM_VILLAGE' : '')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'CUSTOM_VILLAGE') {
                                        setVillage('ភូមិ');
                                        updateFullAddress(province, district, commune, 'ភូមិ', streetDetail);
                                    } else {
                                        setVillage(val);
                                        updateFullAddress(province, district, commune, val, streetDetail);
                                    }
                                }}
                                disabled={!commune}
                                style={{ width: '100%', height: '40px', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.83rem', color: '#0f172a', backgroundColor: !commune ? '#f1f5f9' : '#ffffff' }}
                            >
                                <option value="">-- {commune ? 'ជ្រើសរើសភូមិ' : 'ជ្រើសឃុំមុន'} --</option>
                                {villageList.map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                                <option value="CUSTOM_VILLAGE">✍️ វាយបញ្ចូលភូមិផ្សេងទៀត...</option>
                            </select>
                            {(!villageList.includes(village) && village) && (
                                <input
                                    type="text"
                                    value={village}
                                    onChange={handleVillageChange}
                                    placeholder="បញ្ចូលឈ្មោះភូមិរបស់អ្នក..."
                                    style={{ width: '100%', height: '36px', marginTop: '0.3rem', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #3b82f6', fontSize: '0.82rem' }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Optional Street / House No. Detail */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }}>
                            📍 ផ្លូវ / លេខផ្ទះ / ទីតាំងបន្ថែម (Street / House No. - Optional)
                        </label>
                        <input
                            type="text"
                            value={streetDetail}
                            onChange={handleStreetDetailChange}
                            placeholder="e.g. ផ្លូវលេខ ២៧១, ផ្ទះលេខ ១២A..."
                            style={{ width: '100%', height: '40px', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                        />
                    </div>
                </>
            ) : (
                <div>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        required={required}
                        placeholder="e.g. ភូមិ១, សង្កាត់ទឹកល្អក់១, ខណ្ឌទួលគោក, រាជធានីភ្នំពេញ"
                        style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                </div>
            )}

            {/* Address Summary Preview Badge */}
            {value && (
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', color: '#0369a1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📍 អាសយដ្ឋានពេញលេញ៖ <span style={{ color: '#0f172a', fontWeight: '700' }}>{value}</span>
                </div>
            )}
        </div>
    );
};

export default CambodianAddressSelector;
