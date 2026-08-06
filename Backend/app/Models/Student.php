<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_code',
        'date_of_birth',
        'gender',
        'class_id',
        'phone',
        'address',
        'photo',
        'father_name',
        'father_dob',
        'father_phone',
        'mother_name',
        'mother_dob',
        'mother_phone',
        'place_of_birth',
        'class_position',
        'height_cm',
        'weight_kg',
        'orphan_status',
        'equity_card_type',
        'equity_card_number',
        'scholarship_type',
        'insurance_card_number',
        'student_phone',
        'father_occupation',
        'mother_occupation',
        'family_monthly_income',
    ];

    protected $appends = ['age', 'father_age', 'mother_age', 'photo_url'];

    public function getAgeAttribute()
    {
        if (!$this->date_of_birth) {
            return null;
        }
        try {
            return Carbon::parse($this->date_of_birth)->age;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getFatherAgeAttribute()
    {
        if (!$this->father_dob) {
            return null;
        }
        try {
            return Carbon::parse($this->father_dob)->age;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getMotherAgeAttribute()
    {
        if (!$this->mother_dob) {
            return null;
        }
        try {
            return Carbon::parse($this->mother_dob)->age;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getPhotoUrlAttribute()
    {
        if (!$this->photo) {
            return null;
        }
        if (str_starts_with($this->photo, 'http://') || str_starts_with($this->photo, 'https://')) {
            return $this->photo;
        }
        return url($this->photo);
    }

    // Student belongs to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Student belongs to SchoolClass
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');    
    }

    public function studentParent()
    {
        return $this->hasOne(StudentParent::class);
    }

    public function parents()
    {
        return $this->hasMany(StudentParent::class, 'student_id');
    }
}
