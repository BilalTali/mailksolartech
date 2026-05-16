import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Sun, CheckCircle } from 'lucide-react';
import { agentsApi } from '@/services/agents.api';
import { STATE_DISTRICTS, INDIAN_STATES } from '@/constants/locationData';
import SEOHead from '@/components/shared/SEOHead';
import MobileInput from '@/components/shared/MobileInput';
import { useSettings } from '@/hooks/useSettings';

const schema = z.object({
    name: z.string().min(2, 'Full name is required'),
    mobile: z.string().length(10, 'Must be 10 digits').regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile format'),

    email: z.string().email('Invalid email address').or(z.literal('')).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    state: z.string().min(1, 'State is required'),
    district: z.string().min(1, 'District is required'),
    area: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AgentRegisterPage() {
    const [submitted, setSubmitted] = useState(false);
    const { companyName } = useSettings();

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', state: '', district: '', area: '' },
    });

    const watchedState = watch('state');

    const registerMutation = useMutation({
        mutationFn: (data: FormData) => agentsApi.registerAgent(data as any),
        onSuccess: () => {
            setSubmitted(true);
        },
        onError: (err: any) => {
            const errData = err.response?.data;
            if (errData?.errors) {
                const firstError = Object.values(errData.errors as Record<string, string[]>)[0]?.[0];
                toast.error(firstError || 'Validation failed.');
            } else {
                toast.error(errData?.message || 'Failed to register');
            }
        }
    });

    const onSubmit = (data: FormData) => {
        registerMutation.mutate(data);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <SEOHead title={`Executive Registration - ${companyName}`} />
                <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-10 text-center border top-orange-500 border-t-4 animate-in zoom-in-95 duration-500">
                    <CheckCircle size={64} className="mx-auto text-green-500 mb-6 drop-shadow-sm" />
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Registration Successful</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                        Your application as a Business Development Executive has been submitted successfully to administration for review.
                    </p>
                    <Link to="/login" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors inline-block w-full text-center">
                        Proceed to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <SEOHead title={`Executive Registration - ${companyName}`} />
            
            <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 border shadow-lg shadow-orange-500/30 mb-6">
                    <Sun className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Join as an Executive</h2>
                <p className="mt-2 text-sm text-slate-500">Register as a Business Development Executive</p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        
                        <div className="space-y-1 block">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                            <input 
                                {...register('name')} 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium text-sm" 
                                placeholder="Your full legal name" 
                            />
                            {errors.name && <p className="text-red-500 text-xs font-semibold ml-1">{errors.name.message}</p>}
                        </div>


                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mobile *</label>
                                <MobileInput
                                    label="Mobile"
                                    value={watch('mobile') || ''}
                                    onChange={(v) => setValue('mobile', v, { shouldValidate: true })}
                                    required
                                    className="col-span-1"
                                />
                                {errors.mobile && <p className="text-red-500 text-xs font-semibold ml-1">{errors.mobile.message}</p>}
                            </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    {...register('email')} 
                                    type="email"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium text-sm" 
                                    placeholder="Optional" 
                                />
                                {errors.email && <p className="text-red-500 text-xs font-semibold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password *</label>
                                <input 
                                    {...register('password')} 
                                    type="password"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium text-sm" 
                                    placeholder="Min 8 characters" 
                                />
                                {errors.password && <p className="text-red-500 text-xs font-semibold ml-1">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">State *</label>
                                <select 
                                    {...register('state')} 
                                    onChange={(e) => {
                                        setValue('state', e.target.value, { shouldValidate: true });
                                        setValue('district', '');
                                    }}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all text-sm"
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {errors.state && <p className="text-red-500 text-xs font-semibold ml-1">{errors.state.message}</p>}
                            </div>

                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">District *</label>
                                <select 
                                    {...register('district')} 
                                    disabled={!watchedState}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all text-sm disabled:opacity-50"
                                >
                                    <option value="">Select District</option>
                                    {watchedState && STATE_DISTRICTS[watchedState]?.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                {errors.district && <p className="text-red-500 text-xs font-semibold ml-1">{errors.district.message}</p>}
                            </div>

                            <div className="space-y-1 block">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Area</label>
                                <input 
                                    {...register('area')} 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-slate-300 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium text-sm" 
                                    placeholder="City/Village" 
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={registerMutation.isPending}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {registerMutation.isPending ? 'Registering...' : 'Register as Executive'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500 font-medium">Already registered?</span>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Link to="/login" className="w-full flex justify-center py-3 px-4 border-2 border-slate-200 rounded-xl shadow-sm text-sm font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                            Sign In Instead
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
