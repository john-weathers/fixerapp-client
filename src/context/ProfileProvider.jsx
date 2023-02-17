import { createContext, useState } from 'react';

const ProfileContext = createContext({});

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState({});

    return (
        <AuthContext.Provider value={{ profile, setProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export default ProfileContext;