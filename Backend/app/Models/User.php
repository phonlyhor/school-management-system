<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'gender',
        'password',
        'role_id',
        'photo',
        'date_of_birth',
        'specialization',
        'address',
        'phone',
    ];
    //User have many roles
   public function role()
{
    return $this->belongsTo(Role::class);
}
// Check if user has permission
public function hasPermission(string $permission): bool
{
    return $this->role
        ->permissions()
        ->where('name', $permission)
        ->exists();
}
// User has one student
public function student()
{
    return $this->hasOne(Student::class);
}
//user has many teacher class assignments
public function teacherClassAssignments()
{
    return $this->hasMany(TeacherClassAssignment::class, 'teacher_id');
}
// User has many teacher subject assignments
public function teacherSubjectAssignments()
{
    return $this->hasMany(TeacherSubjectAssignment::class, 'teacher_id');
}
//parnt has one student parent
public function studentParent()
{
    return $this->hasOne(StudentParent::class);
}
// Teacher assigned classes
public function teacherAssignments()
{
    return $this->hasMany(TeacherAssignment::class, 'teacher_id');
}
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];
 

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}
