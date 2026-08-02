import UserManager from '../../components/admin/UserManager';

const Users = () => {
    return (
        <UserManager 
            title="All Users" 
            description="Manage all system users including administrators, teachers, students, and parents."
            roleFilter={null}
        />
    );
};

export default Users;
